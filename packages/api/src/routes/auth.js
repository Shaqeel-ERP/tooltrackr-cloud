import { Hono } from 'hono';
import { sign } from 'hono/jwt';

const auth = new Hono();

// Login — username or email + password
auth.post('/login', async (c) => {
  const { username, email, password } = await c.req.json();
  const identifier = username || email;
  if (!identifier || !password) return c.json({ error: 'Username and password required' }, 400);

  const user = await c.env.DB.prepare(
    `SELECT * FROM users WHERE (username=? OR email=?) AND status='active'`
  ).bind(identifier, identifier).first();

  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  // password_hash column added via migration — plain text during dev
  if (!user.password_hash || user.password_hash !== password)
    return c.json({ error: 'Invalid credentials' }, 401);

  // Update last_login
  await c.env.DB.prepare(`UPDATE users SET last_login=? WHERE id=?`).bind(Date.now(), user.id).run();

  const token = await sign({
    sub: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    default_location_id: user.default_location_id,
    exp: Math.floor(Date.now() / 1000) + 86400 // 24h
  }, c.env.JWT_SECRET, 'HS256');

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      defaultLocationId: user.default_location_id
    }
  });
});

auth.post('/logout', (c) => c.json({ ok: true }));

auth.get('/me', async (c) => {
  const p = c.get('jwtPayload');
  const user = await c.env.DB.prepare(
    `SELECT id, username, full_name, email, role, permissions, default_location_id, status FROM users WHERE id=?`
  ).bind(p.sub).first();
  return c.json(user);
});

export default auth;
