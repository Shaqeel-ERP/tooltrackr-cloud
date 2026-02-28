import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const suppliers = new Hono();

suppliers.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM suppliers WHERE status='active' ORDER BY name`
  ).all();
  return c.json(results);
});

suppliers.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  if (!b.name) return c.json({ error: 'Name required' }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO suppliers (name, contact_info, address, notes, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
  ).bind(b.name, b.contactInfo || '', b.address || '', b.notes || '', user.username, now(), now()).run();
  await audit(c.env.DB, 'supplier_create', 'supplier', r.meta.last_row_id, user.username, `Added supplier ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});

suppliers.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE suppliers SET name=?, contact_info=?, address=?, notes=?, updated_at=? WHERE id=?`
  ).bind(b.name, b.contactInfo || '', b.address || '', b.notes || '', now(), id).run();
  await audit(c.env.DB, 'supplier_update', 'supplier', id, user.username, `Updated supplier #${id}`);
  return c.json({ ok: true });
});

export default suppliers;
