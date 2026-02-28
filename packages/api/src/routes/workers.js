import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const workers = new Hono();

workers.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT w.*,
      COUNT(CASE WHEN l.actual_return_date IS NULL AND l.status='active' THEN 1 END) active_loans,
      COUNT(CASE WHEN l.actual_return_date IS NOT NULL THEN 1 END) total_returns,
      ROUND(100.0 * SUM(CASE WHEN l.actual_return_date IS NOT NULL
        AND (l.expected_return_date IS NULL OR l.actual_return_date <= l.expected_return_date)
        THEN 1 ELSE 0 END)
        / NULLIF(COUNT(CASE WHEN l.actual_return_date IS NOT NULL THEN 1 END), 0), 0) reliability_score
     FROM workers w LEFT JOIN lending l ON l.worker_id=w.id
     WHERE w.status='active' GROUP BY w.id ORDER BY w.name`
  ).all();
  return c.json(results);
});

workers.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const worker = await c.env.DB.prepare(`SELECT * FROM workers WHERE id=?`).bind(id).first();
  if (!worker) return c.json({ error: 'Not found' }, 404);
  const { results: loans } = await c.env.DB.prepare(
    `SELECT ld.*, t.name tool_name, t.sku, t.category, l.name loc_name
     FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.worker_id=? ORDER BY ld.date_out DESC`
  ).bind(id).all();
  return c.json({ ...worker, loans });
});

workers.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  if (!b.name) return c.json({ error: 'Name required' }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO workers (name, email, phone, address, company, worker_type, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  ).bind(b.name, b.email || '', b.phone || '', b.address || '',
    b.company || 'employee', b.workerType || '', user.username).run();
  await audit(c.env.DB, 'worker_create', 'worker', r.meta.last_row_id, user.username, `Added worker ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});

workers.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE workers SET name=?, email=?, phone=?, address=?, company=?, worker_type=?, updated_by=? WHERE id=?`
  ).bind(b.name, b.email || '', b.phone || '', b.address || '',
    b.company || 'employee', b.workerType || '', user.username, id).run();
  await audit(c.env.DB, 'worker_update', 'worker', id, user.username, `Updated worker #${id}`);
  return c.json({ ok: true });
});

workers.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');
  const active = await c.env.DB.prepare(
    `SELECT COUNT(*) c FROM lending WHERE worker_id=? AND actual_return_date IS NULL AND status='active'`
  ).bind(id).first('c');
  if (active > 0) return c.json({ error: 'Cannot delete — worker has active loans' }, 400);
  await c.env.DB.prepare(`UPDATE workers SET status='inactive', updated_by=? WHERE id=?`).bind(user.username, id).run();
  await audit(c.env.DB, 'worker_deactivate', 'worker', id, user.username, `Deactivated worker #${id}`);
  return c.json({ ok: true });
});

export default workers;
