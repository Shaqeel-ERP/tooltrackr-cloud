import { Hono } from 'hono';
import { audit, now } from '../lib/audit.js';
const imp = new Hono();

imp.post('/', async (c) => {
  const user = c.get('jwtPayload');
  const type = c.req.query('type');
  const { csv } = await c.req.json();
  if (!csv) return c.json({ error: 'No CSV provided' }, 400);
  const lines = csv.trim().split('\n').map(l => l.split(',').map(v => v.trim().replace(/^"|"$/g, '')));
  const headers = lines[0].map(h => h.toLowerCase().replace(/\s+/g,'_'));
  const rows = lines.slice(1).filter(r => r.some(v => v));
  let imported = 0; const errors = [];

  if (type === 'tools') {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h,i) => [h, row[i]||'']));
      if (!o.sku || !o.name) { errors.push(`Skipped row — missing sku or name`); continue; }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO tools (sku, name, category, brand, model, min_stock_level, unit_of_measure, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'piece', 'active', ?, ?)`
        ).bind(o.sku.toUpperCase(), o.name, o.category||'', o.brand||'', o.model||'', parseInt(o.min_stock_level)||0, now(), now()).run();
        if (r.meta.changes > 0) imported++;
      } catch(e) { errors.push(`${o.sku}: ${e.message}`); }
    }
  }

  if (type === 'workers') {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h,i) => [h, row[i]||'']));
      if (!o.name) { errors.push(`Skipped row — missing name`); continue; }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO workers (name, email, phone, address, company, worker_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
        ).bind(o.name, o.email||'', o.phone||'', o.address||'', o.company||'employee', o.worker_type||'', user.username).run();
        if (r.meta.changes > 0) imported++;
      } catch(e) { errors.push(`${o.name}: ${e.message}`); }
    }
  }

  if (type === 'locations') {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h,i) => [h, row[i]||'']));
      if (!o.name) { errors.push(`Skipped row — missing name`); continue; }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO locations (name, address, manager, contact_info, location_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
        ).bind(o.name, o.address||'', o.manager||'', o.contact_info||'', o.location_type||'warehouse', now(), now()).run();
        if (r.meta.changes > 0) imported++;
      } catch(e) { errors.push(`${o.name}: ${e.message}`); }
    }
  }

  await audit(c.env.DB, 'import', type, 0, user.username, `Imported ${imported} ${type} via CSV`);
  return c.json({ ok: true, imported, errors });
});

imp.get('/export', async (c) => {
  const type = c.req.query('type') || 'tools';
  const queries = {
    tools:     `SELECT sku, name, category, brand, model, min_stock_level, unit_of_measure FROM tools WHERE status!='deleted'`,
    workers:   `SELECT name, email, phone, address, company, worker_type FROM workers WHERE status='active'`,
    stock:     `SELECT t.sku, t.name, l.name location, tl.quantity, tl.reserved_quantity, tl.min_stock_level FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id WHERE t.status='active'`,
    movements: `SELECT sm.movement_type, t.sku, t.name, l.name location, sm.quantity, sm.performed_by, sm.performed_at FROM stock_movements sm JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id ORDER BY sm.performed_at DESC LIMIT 1000`,
    lending:   `SELECT t.sku, t.name tool_name, w.name worker_name, l.name location, ld.quantity, ld.date_out, ld.expected_return_date, ld.actual_return_date, ld.return_condition, ld.status FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN workers w ON w.id=ld.worker_id JOIN locations l ON l.id=ld.location_id ORDER BY ld.date_out DESC`
  };
  const q = queries[type];
  if (!q) return c.json({ error: 'Unknown export type' }, 400);
  const { results } = await c.env.DB.prepare(q).all();
  if (!results.length) return c.text('No data', 200);
  const headers = Object.keys(results[0]);
  const csv = [headers.join(','), ...results.map(r =>
    headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )].join('\n');
  return new Response(csv, { headers: {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${type}_export.csv"`
  }});
});

export default imp;
