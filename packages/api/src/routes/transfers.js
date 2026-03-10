import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const transfers = new Hono();

transfers.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tr.*, fl.name from_loc, tl.name to_loc,
      t.name tool_name, t.sku, ti.tool_id, ti.requested_quantity as quantity
     FROM transfers tr
     JOIN locations fl ON fl.id=tr.from_location_id
     JOIN locations tl ON tl.id=tr.to_location_id
     LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
     LEFT JOIN tools t ON t.id=ti.tool_id
     ORDER BY tr.created_at DESC LIMIT 200`
  ).all();
  return c.json(results);
});

transfers.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');

  if (b.fromLocationId === b.toLocationId)
    return c.json({ error: 'Source and destination must differ' }, 400);

  // Validate stock exists
  const row = await c.env.DB.prepare(
    `SELECT quantity - reserved_quantity avail FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.fromLocationId).first('avail');
  if ((row || 0) < b.quantity)
    return c.json({ error: `Only ${row || 0} available at source` }, 400);

  // Instant deduction from source
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(b.quantity, now(), b.toolId, b.fromLocationId).run();

  // Instant addition to destination
  const dest = await c.env.DB.prepare(
    `SELECT id FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.toLocationId).first();
  if (dest) {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(b.quantity, now(), b.toolId, b.toLocationId).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated)
       VALUES (?, ?, ?, 0, 0, 0, ?)`
    ).bind(b.toolId, b.toLocationId, b.quantity, now()).run();
  }

  // Insert transfer as directly completed
  const r = await c.env.DB.prepare(
    `INSERT INTO transfers (from_location_id, to_location_id, status, requested_by, approved_by, completed_by, transfer_date, completed_at, notes, created_at)
     VALUES (?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)`
  ).bind(b.fromLocationId, b.toLocationId, user.username, user.username, user.username, now(), now(), b.notes || '', now()).run();
  const tid = r.meta.last_row_id;

  // Insert transfer_items with transferred_quantity matching requested immediately
  await c.env.DB.prepare(
    `INSERT INTO transfer_items (transfer_id, tool_id, requested_quantity, transferred_quantity) VALUES (?, ?, ?, ?)`
  ).bind(tid, b.toolId, b.quantity, b.quantity).run();

  // Log both stock movements simultaneously
  for (const [loc, type] of [
    [b.fromLocationId, 'transfer_out'],
    [b.toLocationId,   'transfer_in']
  ]) {
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at)
       VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?)`
    ).bind(b.toolId, loc, type, b.quantity, tid, user.username, now()).run();
  }

  const t = await c.env.DB.prepare("SELECT sku FROM tools WHERE id=?").bind(b.toolId).first('sku');
  await audit(c.env.DB, 'transfer_create_complete', 'transfer', tid, user.username,
    `Transfer completed instantly: ${b.quantity}x ${t || b.toolId} from loc ${b.fromLocationId} → ${b.toLocationId}`);
  return c.json({ ok: true, id: tid }, 201);
});

transfers.post('/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  // 1. Fetch transfer
  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();

  if (!tr) return c.json({ error: 'Transfer not found' }, 404);
  if (tr.status !== 'draft')
    return c.json({ error: `Cannot approve — transfer is already ${tr.status}` }, 400);

  // 2. Re-check availability at time of approval (stock may have changed since draft)
  const row = await c.env.DB.prepare(
    `SELECT quantity - reserved_quantity avail FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(tr.tool_id, tr.from_location_id).first('avail');
  if ((row || 0) < tr.quantity)
    return c.json({ error: `Insufficient stock — only ${row || 0} available at source now` }, 400);

  // 3. Reserve stock at source NOW
  await c.env.DB.prepare(
    `UPDATE tool_locations SET reserved_quantity=reserved_quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(tr.quantity, now(), tr.tool_id, tr.from_location_id).run();

  // 4. Update status
  await c.env.DB.prepare(
    `UPDATE transfers SET status='approved', approved_by=? WHERE id=?`
  ).bind(user.username, id).run();

  await audit(c.env.DB, 'transfer_approve', 'transfer', id, user.username,
    'Transfer approved — stock reserved at source');
  return c.json({ ok: true });
});

transfers.post('/:id/complete', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity, ti.id as ti_id
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();
  if (!tr) return c.json({ error: 'Not found' }, 404);
  if (tr.status === 'completed') return c.json({ error: 'Already completed' }, 400);
  if (tr.status !== 'approved')
    return c.json({ error: 'Transfer must be approved before completing' }, 400);

  // Remove from source — deduct physical quantity AND release the reservation
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, reserved_quantity=reserved_quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(tr.quantity, tr.quantity, now(), tr.tool_id, tr.from_location_id).run();

  // Add to destination — upsert
  const dest = await c.env.DB.prepare(
    `SELECT id FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(tr.tool_id, tr.to_location_id).first();
  if (dest) {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(tr.quantity, now(), tr.tool_id, tr.to_location_id).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated)
       VALUES (?, ?, ?, 0, 0, 0, ?)`
    ).bind(tr.tool_id, tr.to_location_id, tr.quantity, now()).run();
  }

  // Update transfer_items transferred_quantity
  if (tr.ti_id) {
    await c.env.DB.prepare(
      `UPDATE transfer_items SET transferred_quantity=? WHERE id=?`
    ).bind(tr.quantity, tr.ti_id).run();
  }

  // Log both movements
  for (const [loc, type] of [
    [tr.from_location_id, 'transfer_out'],
    [tr.to_location_id,   'transfer_in']
  ]) {
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at)
       VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?)`
    ).bind(tr.tool_id, loc, type, tr.quantity, id, user.username, now()).run();
  }

  await c.env.DB.prepare(
    `UPDATE transfers SET status='completed', completed_by=?, completed_at=? WHERE id=?`
  ).bind(user.username, now(), id).run();

  await audit(c.env.DB, 'transfer_complete', 'transfer', id, user.username,
    'Transfer completed — stock physically moved');
  return c.json({ ok: true });
});

transfers.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity 
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();

  if (!tr) return c.json({ error: 'Not found' }, 404);
  if (tr.status === 'completed')
    return c.json({ error: 'Cannot cancel a completed transfer' }, 400);

  // Only release reservation if it was approved (stock was reserved on approve)
  if (tr.status === 'approved') {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET reserved_quantity=MAX(0, reserved_quantity-?), last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(tr.quantity, now(), tr.tool_id, tr.from_location_id).run();
  }

  await c.env.DB.prepare(
    `UPDATE transfers SET status='cancelled', completed_at=? WHERE id=?`
  ).bind(now(), id).run();

  await audit(c.env.DB, 'transfer_cancel', 'transfer', id, user.username,
    tr.status === 'approved'
      ? 'Transfer cancelled — reserved stock released'
      : 'Transfer cancelled (was still draft)');
  return c.json({ ok: true });
});

export default transfers;
