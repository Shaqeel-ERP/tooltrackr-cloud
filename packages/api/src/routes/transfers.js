import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const transfers = new Hono();

transfers.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tr.*, fl.name from_loc, tl.name to_loc,
      t.name tool_name, t.sku
     FROM transfers tr
     JOIN locations fl ON fl.id=tr.from_location_id
     JOIN locations tl ON tl.id=tr.to_location_id
     JOIN tools t ON t.id=tr.tool_id
     ORDER BY tr.created_at DESC LIMIT 200`
  ).all();
  return c.json(results);
});

transfers.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');

  if (b.fromLocationId === b.toLocationId)
    return c.json({ error: 'Source and destination must differ' }, 400);

  // Just validate stock exists — do NOT reserve yet (reservation happens on approve)
  const row = await c.env.DB.prepare(
    `SELECT quantity - reserved_quantity avail FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.fromLocationId).first('avail');
  if ((row || 0) < b.quantity)
    return c.json({ error: `Only ${row || 0} available at source` }, 400);

  // Insert transfer as draft — no stock changes
  const r = await c.env.DB.prepare(
    `INSERT INTO transfers (tool_id, quantity, from_location_id, to_location_id, status, requested_by, requested_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
  ).bind(b.toolId, b.quantity, b.fromLocationId, b.toLocationId,
    user.username, now(), b.notes || '', now(), now()).run();
  const tid = r.meta.last_row_id;

  const t = await c.env.DB.prepare("SELECT sku FROM tools WHERE id=?").bind(b.toolId).first('sku');
  await audit(c.env.DB, 'transfer_create', 'transfer', tid, user.username,
    `Transfer request: ${b.quantity}x ${t?.sku} from loc ${b.fromLocationId} → ${b.toLocationId}`);
  return c.json({ ok: true, id: tid }, 201);
});

transfers.post('/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  // 1. Fetch transfer
  const tr = await c.env.DB.prepare(`SELECT * FROM transfers WHERE id=?`).bind(id).first();
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
    `UPDATE transfers SET status='approved', approved_by=?, approved_at=?, updated_at=? WHERE id=?`
  ).bind(user.username, now(), now(), id).run();

  await audit(c.env.DB, 'transfer_approve', 'transfer', id, user.username,
    'Transfer approved — stock reserved at source');
  return c.json({ ok: true });
});

transfers.post('/:id/complete', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  const tr = await c.env.DB.prepare(`SELECT * FROM transfers WHERE id=?`).bind(id).first();
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

  // Log both movements
  for (const [loc, type] of [
    [tr.from_location_id, 'transfer_out'],
    [tr.to_location_id,   'transfer_in']
  ]) {
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at, timestamp)
       VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?, ?)`
    ).bind(tr.tool_id, loc, type, tr.quantity, id, user.username, now(), now()).run();
  }

  await c.env.DB.prepare(
    `UPDATE transfers SET status='completed', transferred_by=?, transferred_at=?, received_by=?, received_at=?, updated_at=? WHERE id=?`
  ).bind(user.username, now(), user.username, now(), now(), id).run();

  await audit(c.env.DB, 'transfer_complete', 'transfer', id, user.username,
    'Transfer completed — stock physically moved');
  return c.json({ ok: true });
});

transfers.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');

  const tr = await c.env.DB.prepare(`SELECT * FROM transfers WHERE id=?`).bind(id).first();
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
    `UPDATE transfers SET status='cancelled', updated_at=? WHERE id=?`
  ).bind(now(), id).run();

  await audit(c.env.DB, 'transfer_cancel', 'transfer', id, user.username,
    tr.status === 'approved'
      ? 'Transfer cancelled — reserved stock released'
      : 'Transfer cancelled (was still draft)');
  return c.json({ ok: true });
});

export default transfers;
