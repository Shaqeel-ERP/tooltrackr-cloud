import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const users = new Hono();

users.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, username, full_name, email, role, permissions, default_location_id, status, last_login, created_at FROM users ORDER BY full_name`
  ).all();
  return c.json(results);
});

users.post('/', async (c) => {
  const b = await c.req.json();
  const actor = c.get('jwtPayload');
  if (!b.username || !b.password) return c.json({ error: 'Username and password required' }, 400);
  const exists = await c.env.DB.prepare(`SELECT id FROM users WHERE username=?`).bind(b.username).first();
  if (exists) return c.json({ error: 'Username already taken' }, 409);
  const r = await c.env.DB.prepare(
    `INSERT INTO users (username, full_name, email, role, password_hash, status, created_at, updated_at) VALUES (?,?,?,?,?,'active',?,?)`
  ).bind(b.username, b.fullName || b.username, b.email || '', b.role || 'User', b.password, now(), now()).run();
  await audit(c.env.DB, 'user_create', 'user', r.meta.last_row_id, actor.sub, `Created user ${b.username}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});

users.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const actor = c.get('jwtPayload');
  await c.env.DB.prepare(
    `UPDATE users SET full_name=?, email=?, role=?, permissions=?, default_location_id=?, updated_at=? WHERE id=?`
  ).bind(b.fullName, b.email || '', b.role, b.permissions || null, b.defaultLocationId || null, now(), id).run();
  if (b.password) {
    await c.env.DB.prepare(`UPDATE users SET password_hash=? WHERE id=?`).bind(b.password, id).run();
  }
  await audit(c.env.DB, 'user_update', 'user', id, actor.sub, `Updated user #${id}`);
  return c.json({ ok: true });
});

users.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const actor = c.get('jwtPayload');
  if (id === actor.sub) return c.json({ error: 'Cannot deactivate yourself' }, 400);
  await c.env.DB.prepare(`UPDATE users SET status='inactive', updated_at=? WHERE id=?`).bind(now(), id).run();
  await audit(c.env.DB, 'user_deactivate', 'user', id, actor.sub, `Deactivated user #${id}`);
  return c.json({ ok: true });
});

export default users;
