import { Hono } from 'hono';
const stock = new Hono();

stock.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tl.*, t.name tool_name, t.sku, t.category, t.brand, l.name loc_name
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
     WHERE t.status='active' ORDER BY t.name, l.name`
  ).all();
  return c.json(results);
});

stock.get('/movements', async (c) => {
  const { limit = '200', movement_type } = c.req.query();
  let q = `SELECT sm.*, t.name tool_name, t.sku, l.name loc_name FROM stock_movements sm
    JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id WHERE 1=1`;
  const p = [];
  if (movement_type) { q += ` AND sm.movement_type=?`; p.push(movement_type); }
  q += ` ORDER BY sm.performed_at DESC LIMIT ?`;
  p.push(parseInt(limit));
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});

export default stock;
