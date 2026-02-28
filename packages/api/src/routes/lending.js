import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const lending = new Hono();

lending.get('/', async (c) => {
  const { status, worker_id } = c.req.query();
  let where = `WHERE 1=1`;
  const p = [];
  if (status === 'active')   { where += ` AND ld.actual_return_date IS NULL AND ld.status='active'`; }
  if (status === 'overdue')  { where += ` AND ld.actual_return_date IS NULL AND ld.status='active' AND ld.expected_return_date < ?`; p.push(now()); }
  if (status === 'returned') { where += ` AND ld.actual_return_date IS NOT NULL`; }
  if (worker_id)             { where += ` AND ld.worker_id=?`; p.push(parseInt(worker_id)); }
  const { results } = await c.env.DB.prepare(
    `SELECT ld.*, t.name tool_name, t.sku, t.category, t.brand,
      w.name worker_name, w.phone worker_phone, w.worker_type, l.name loc_name
     FROM lending ld
     JOIN tools t ON t.id=ld.tool_id
     JOIN workers w ON w.id=ld.worker_id
     JOIN locations l ON l.id=ld.location_id
     ${where} ORDER BY ld.date_out DESC LIMIT 500`
  ).bind(...p).all();
  return c.json(results);
});

lending.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  // Check available stock
  const row = await c.env.DB.prepare(
    `SELECT quantity, reserved_quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.locationId).first();
  const avail = (row?.quantity || 0) - (row?.reserved_quantity || 0);
  if (avail < b.quantity) return c.json({ error: `Only ${avail} available` }, 400);
  // Create loan
  const r = await c.env.DB.prepare(
    `INSERT INTO lending (tool_id, worker_id, location_id, quantity, date_out, expected_return_date, project_code, job_site, issued_by, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(b.toolId, b.workerId, b.locationId, b.quantity,
    b.dateOut || now(), b.expectedReturnDate || null,
    b.projectCode || '', b.jobSite || '',
    user.username, b.notes || '', now(), now()).run();
  const lid = r.meta.last_row_id;
  // Decrement stock
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(b.quantity, now(), b.toolId, b.locationId).run();
  // Log movement
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at, timestamp, notes)
     VALUES (?, ?, 'stock_out', ?, 'lending', ?, ?, ?, ?, ?)`
  ).bind(b.toolId, b.locationId, b.quantity, lid, user.username, now(), now(), b.notes || '').run();
  const t = await c.env.DB.prepare("SELECT name, sku FROM tools WHERE id=?").bind(b.toolId).first();
  const w = await c.env.DB.prepare("SELECT name FROM workers WHERE id=?").bind(b.workerId).first();
  await audit(c.env.DB, 'lending_create', 'lending', lid, user.username,
    `Issued ${b.quantity}x ${t?.sku} (${t?.name}) to ${w?.name}`, b.locationId);
  return c.json({ ok: true, id: lid }, 201);
});

lending.post('/:id/return', async (c) => {
  const lid = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  const loan = await c.env.DB.prepare(`SELECT * FROM lending WHERE id=?`).bind(lid).first();
  if (!loan) return c.json({ error: 'Loan not found' }, 404);
  if (loan.actual_return_date) return c.json({ error: 'Already returned' }, 400);
  const retLoc = b.returnLocationId || loan.location_id;
  await c.env.DB.prepare(
    `UPDATE lending SET actual_return_date=?, return_condition=?, returned_to=?, return_location_id=?, status='returned', updated_at=?,
     notes=CASE WHEN notes IS NULL OR notes='' THEN ? ELSE notes||char(10)||? END WHERE id=?`
  ).bind(now(), b.condition || 'good', user.username, retLoc, now(),
    `Return: ${b.returnNote || ''}`, `Return: ${b.returnNote || ''}`, lid).run();
  // Only return stock if not lost
  if (b.condition !== 'lost') {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(loan.quantity, now(), loan.tool_id, retLoc).run();
  }
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at, timestamp, notes)
     VALUES (?, ?, 'stock_in', ?, 'lending_return', ?, ?, ?, ?, ?)`
  ).bind(loan.tool_id, retLoc, loan.quantity, lid, user.username, now(), now(),
    `Condition: ${b.condition || 'good'}`).run();
  const t = await c.env.DB.prepare("SELECT name, sku FROM tools WHERE id=?").bind(loan.tool_id).first();
  const w = await c.env.DB.prepare("SELECT name FROM workers WHERE id=?").bind(loan.worker_id).first();
  await audit(c.env.DB, 'lending_return', 'lending', lid, user.username,
    `${w?.name} returned ${loan.quantity}x ${t?.sku} — ${b.condition || 'good'}`, retLoc);
  return c.json({ ok: true });
});

export default lending;
