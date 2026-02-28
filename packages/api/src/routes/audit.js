import { Hono } from 'hono';
const auditRoute = new Hono();

auditRoute.get('/', async (c) => {
  const { search, entity_type, action } = c.req.query();
  let q = `SELECT al.*, u.username, u.full_name FROM audit_log al LEFT JOIN users u ON u.id=al.user_id WHERE 1=1`;
  const p = [];
  if (search)      { q += ` AND (al.action LIKE ? OR al.entity_type LIKE ? OR al.details LIKE ?)`; p.push(...Array(3).fill(`%${search}%`)); }
  if (entity_type) { q += ` AND al.entity_type=?`; p.push(entity_type); }
  if (action)      { q += ` AND al.action=?`; p.push(action); }
  q += ` ORDER BY al.timestamp DESC LIMIT 300`;
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});

export default auditRoute;
