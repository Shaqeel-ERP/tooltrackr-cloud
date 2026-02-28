import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const tools = new Hono();

tools.get('/', async (c) => {
  const { locationId, status, search } = c.req.query();
  let q = `SELECT t.*, s.name supplier_name,
    COALESCE((SELECT SUM(tl.quantity) FROM tool_locations tl WHERE tl.tool_id=t.id), 0) total_stock,
    COALESCE((SELECT SUM(tl.reserved_quantity) FROM tool_locations tl WHERE tl.tool_id=t.id), 0) total_reserved
    FROM tools t LEFT JOIN suppliers s ON s.id=t.supplier_id WHERE 1=1`;
  const p = [];
  if (status)     { q += ` AND t.status=?`; p.push(status); }
  else            { q += ` AND t.status != 'deleted'`; }
  if (locationId) { q += ` AND EXISTS (SELECT 1 FROM tool_locations tl WHERE tl.tool_id=t.id AND tl.location_id=?)`; p.push(locationId); }
  if (search)     { q += ` AND (t.name LIKE ? OR t.sku LIKE ? OR t.brand LIKE ? OR t.category LIKE ?)`; p.push(...Array(4).fill(`%${search}%`)); }
  q += ` ORDER BY t.name`;
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});

tools.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const tool = await c.env.DB.prepare(
    `SELECT t.*, s.name supplier_name FROM tools t LEFT JOIN suppliers s ON s.id=t.supplier_id WHERE t.id=?`
  ).bind(id).first();
  if (!tool) return c.json({ error: 'Not found' }, 404);
  const { results: stock } = await c.env.DB.prepare(
    `SELECT tl.*, l.name loc_name FROM tool_locations tl JOIN locations l ON l.id=tl.location_id WHERE tl.tool_id=?`
  ).bind(id).all();
  const { results: movements } = await c.env.DB.prepare(
    `SELECT sm.*, l.name loc_name FROM stock_movements sm JOIN locations l ON l.id=sm.location_id WHERE sm.tool_id=? ORDER BY sm.performed_at DESC LIMIT 50`
  ).bind(id).all();
  const { results: loans } = await c.env.DB.prepare(
    `SELECT ld.*, w.name worker_name, l.name loc_name FROM lending ld
     JOIN workers w ON w.id=ld.worker_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.tool_id=? AND ld.actual_return_date IS NULL ORDER BY ld.date_out DESC`
  ).bind(id).all();
  const { results: maintenance } = await c.env.DB.prepare(
    `SELECT tm.*, l.name loc_name FROM tool_maintenance tm JOIN locations l ON l.id=tm.location_id WHERE tm.tool_id=? ORDER BY tm.created_at DESC`
  ).bind(id).all();
  return c.json({ ...tool, stock, movements, loans, maintenance });
});

tools.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  if (!b.sku || !b.name) return c.json({ error: 'SKU and name required' }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO tools (sku, name, description, category, brand, model, serial_number, supplier_id, min_stock_level, unit_of_measure, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(b.sku.toUpperCase(), b.name, b.description || '', b.category || '', b.brand || '',
    b.model || '', b.serialNumber || '', b.supplierId || null,
    b.minStockLevel || 0, b.unitOfMeasure || 'piece', now(), now()).run();
  const id = r.meta.last_row_id;
  // Auto-create tool_location rows for all active locations
  const { results: locs } = await c.env.DB.prepare(`SELECT id FROM locations WHERE status='active'`).all();
  for (const loc of locs) {
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated) VALUES (?,?,0,0,?,0,?)`
    ).bind(id, loc.id, b.minStockLevel || 0, now()).run();
  }
  await audit(c.env.DB, 'tool_create', 'tool', id, user.username, `Created tool ${b.sku} — ${b.name}`);
  return c.json({ ok: true, id }, 201);
});

tools.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE tools SET name=?, description=?, category=?, brand=?, model=?, serial_number=?, supplier_id=?, min_stock_level=?, unit_of_measure=?, updated_at=? WHERE id=?`
  ).bind(b.name, b.description || '', b.category || '', b.brand || '', b.model || '',
    b.serialNumber || '', b.supplierId || null, b.minStockLevel || 0, b.unitOfMeasure || 'piece', now(), id).run();
  await audit(c.env.DB, 'tool_update', 'tool', id, user.username, `Updated tool #${id}`);
  return c.json({ ok: true });
});

tools.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');
  const active = await c.env.DB.prepare(
    `SELECT COUNT(*) c FROM lending WHERE tool_id=? AND actual_return_date IS NULL AND status='active'`
  ).bind(id).first('c');
  if (active > 0) return c.json({ error: 'Cannot delete — tool has active loans' }, 400);
  await c.env.DB.prepare(`UPDATE tools SET status='deleted', updated_at=? WHERE id=?`).bind(now(), id).run();
  await audit(c.env.DB, 'tool_delete', 'tool', id, user.username, `Soft deleted tool #${id}`);
  return c.json({ ok: true });
});

tools.post('/:id/adjust-stock', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { location_id, quantity, reason } = await c.req.json();
  const user = c.get('jwtPayload');
  const row = await c.env.DB.prepare(
    `SELECT quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(id, location_id).first();
  const current = row?.quantity || 0;
  const diff = quantity - current;
  if (diff === 0) return c.json({ ok: true, message: 'No change' });
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(quantity, now(), id, location_id).run();
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, notes, performed_by, performed_at, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, location_id, diff > 0 ? 'stock_in' : 'stock_out', Math.abs(diff),
    reason || 'Manual adjustment', user.username, now(), now()).run();
  await audit(c.env.DB, 'stock_adjust', 'tool', id, user.username,
    `Stock adjusted ${diff > 0 ? '+' : ''}${diff} (now ${quantity}) — ${reason}`, location_id);
  return c.json({ ok: true, previous: current, new: quantity, diff });
});

tools.post('/:id/maintenance/send', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { location_id, units, reason, expected_completion } = await c.req.json();
  const user = c.get('jwtPayload');
  const avail = await c.env.DB.prepare(
    `SELECT quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(id, location_id).first('quantity');
  if ((avail || 0) < units) return c.json({ error: `Only ${avail || 0} available` }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO tool_maintenance (tool_id, location_id, units_in_maintenance, maintenance_reason, started_at, expected_completion, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, ?)`
  ).bind(id, location_id, units, reason || '', now(), expected_completion || null, now(), now()).run();
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(units, now(), id, location_id).run();
  await audit(c.env.DB, 'maintenance_out', 'tool', id, user.username,
    `Sent ${units} units to maintenance — ${reason}`, location_id);
  return c.json({ ok: true, id: r.meta.last_row_id });
});

tools.post('/:id/maintenance/return', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { maintenance_id, units_returned, location_id } = await c.req.json();
  const user = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE tool_maintenance SET status='completed', updated_at=? WHERE id=?`
  ).bind(now(), maintenance_id).run();
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(units_returned, now(), id, location_id).run();
  await audit(c.env.DB, 'maintenance_return', 'tool', id, user.username,
    `Returned ${units_returned} units from maintenance #${maintenance_id}`, location_id);
  return c.json({ ok: true });
});

export default tools;
