import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const purchases = new Hono();

purchases.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, s.name supplier_name, COUNT(pi.id) item_count
     FROM purchases p
     LEFT JOIN suppliers s ON s.id=p.supplier_id
     LEFT JOIN purchase_items pi ON pi.purchase_id=p.id
     GROUP BY p.id ORDER BY p.created_at DESC`
  ).all();
  return c.json(results);
});

purchases.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const p = await c.env.DB.prepare(
    `SELECT p.*, s.name supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE p.id=?`
  ).bind(id).first();
  if (!p) return c.json({ error: 'Not found' }, 404);
  const { results: items } = await c.env.DB.prepare(
    `SELECT pi.*, t.name tool_name, t.sku, l.name loc_name
     FROM purchase_items pi JOIN tools t ON t.id=pi.tool_id JOIN locations l ON l.id=pi.location_id
     WHERE pi.purchase_id=?`
  ).bind(id).all();
  return c.json({ ...p, items });
});

purchases.post('/', async (c) => {
  const b = await c.req.json();
  const user = c.get('jwtPayload');
  const r = await c.env.DB.prepare(
    `INSERT INTO purchases (supplier_id, invoice_number, invoice_date, total_amount, tax_amount, discount_amount, payment_status, received_by, notes, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'pending', ?, ?, ?)`
  ).bind(b.supplierId || null, b.invoiceNumber, b.invoiceDate || now(),
    b.totalAmount || 0, b.taxAmount || 0, b.discountAmount || 0,
    user.username, b.notes || '', user.username, now(), now()).run();
  const pid = r.meta.last_row_id;
  for (const item of (b.items || [])) {
    await c.env.DB.prepare(
      `INSERT INTO purchase_items (purchase_id, tool_id, location_id, quantity, unit_cost, total_cost, received_quantity)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).bind(pid, item.toolId, item.locationId, item.quantity, item.unitCost || 0, item.quantity * (item.unitCost || 0)).run();
  }
  await audit(c.env.DB, 'purchase_create', 'purchase', pid, user.username,
    `Created PO ${b.invoiceNumber} with ${(b.items || []).length} items`);
  return c.json({ ok: true, id: pid }, 201);
});

purchases.post('/:id/receive', async (c) => {
  const pid = parseInt(c.req.param('id'));
  const user = c.get('jwtPayload');
  const p = await c.env.DB.prepare(`SELECT * FROM purchases WHERE id=?`).bind(pid).first();
  if (!p) return c.json({ error: 'Not found' }, 404);
  if (p.status === 'completed') return c.json({ error: 'Already received' }, 400);
  const { results: items } = await c.env.DB.prepare(`SELECT * FROM purchase_items WHERE purchase_id=?`).bind(pid).all();
  for (const item of items) {
    const exists = await c.env.DB.prepare(
      `SELECT id FROM tool_locations WHERE tool_id=? AND location_id=?`
    ).bind(item.tool_id, item.location_id).first();
    if (exists) {
      await c.env.DB.prepare(
        `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
      ).bind(item.quantity, now(), item.tool_id, item.location_id).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated) VALUES (?,?,?,0,0,0,?)`
      ).bind(item.tool_id, item.location_id, item.quantity, now()).run();
    }
    await c.env.DB.prepare(
      `UPDATE purchase_items SET received_quantity=quantity WHERE id=?`
    ).bind(item.id).run();
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, unit_cost, total_cost, invoice_number, performed_by, performed_at, timestamp)
       VALUES (?, ?, 'stock_in', ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)`
    ).bind(item.tool_id, item.location_id, item.quantity, pid,
      item.unit_cost || 0, item.total_cost || 0, p.invoice_number,
      user.username, now(), now()).run();
  }
  await c.env.DB.prepare(
    `UPDATE purchases SET status='completed', payment_status='paid', received_by=?, updated_at=? WHERE id=?`
  ).bind(user.username, now(), pid).run();
  await audit(c.env.DB, 'stock_receive', 'purchase', pid, user.username,
    `Received ${items.length} items from PO ${p.invoice_number}`);
  return c.json({ ok: true });
});

export default purchases;
