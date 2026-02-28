import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const locations = new Hono();

locations.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM locations WHERE status='active' ORDER BY name`
  ).all();
  return c.json(results);
});

locations.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const loc = await c.env.DB.prepare(`SELECT * FROM locations WHERE id=?`).bind(id).first();
  if (!loc) return c.json({ error: 'Not found' }, 404);
  const { results: stock } = await c.env.DB.prepare(
    `SELECT tl.*, t.name tool_name, t.sku, t.category, t.brand, t.min_stock_level
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id
     WHERE tl.location_id=? AND t.status='active' ORDER BY t.name`
  ).bind(id).all();
  const { results: active_transfers } = await c.env.DB.prepare(
    `SELECT tr.*, t.name tool_name, t.sku, fl.name from_loc, tl.name to_loc
     FROM transfers tr JOIN tools t ON t.id=tr.tool_id
     JOIN locations fl ON fl.id=tr.from_location_id JOIN locations tl ON tl.id=tr.to_location_id
     WHERE (tr.from_location_id=? OR tr.to_location_id=?) AND tr.status NOT IN ('completed','cancelled')
     ORDER BY tr.created_at DESC`
  ).bind(id, id).all();
  return c.json({ ...loc, stock, active_transfers });
});

locations.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  if (!b.name) return c.json({ error: 'Name required' }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO locations (name, address, manager, contact_info, location_type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(b.name, b.address || '', b.manager || '', b.contactInfo || '',
    b.locationType || 'warehouse', now(), now()).run();
  await audit(c.env.DB, 'location_create', 'location', r.meta.last_row_id, user.username, `Added location ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});

locations.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE locations SET name=?, address=?, manager=?, contact_info=?, location_type=?, updated_at=? WHERE id=?`
  ).bind(b.name, b.address || '', b.manager || '', b.contactInfo || '',
    b.locationType || 'warehouse', now(), id).run();
  await audit(c.env.DB, 'location_update', 'location', id, user.username, `Updated location #${id}`);
  return c.json({ ok: true });
});

export default locations;
