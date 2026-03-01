import { Hono } from 'hono';
const analytics = new Hono();

analytics.get('/dashboard', async (c) => {
  const n = now();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [tools, workers, loans, overdue, low, todayMvs, lowItems, overdueItems, recentMvs] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) c FROM tools WHERE status='active'`).first('c'),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM workers WHERE status='active'`).first('c'),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM lending WHERE actual_return_date IS NULL AND status='active'`).first('c'),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM lending WHERE actual_return_date IS NULL AND status='active' AND expected_return_date < ?`).bind(n).first('c'),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id WHERE tl.quantity <= tl.min_stock_level AND tl.quantity >= 0 AND t.status='active'`).first('c'),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM stock_movements WHERE performed_at >= ?`).bind(todayStart.getTime()).first('c'),
    c.env.DB.prepare(`SELECT t.sku, t.name, l.name loc_name, tl.quantity, tl.min_stock_level
      FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
      WHERE tl.quantity <= tl.min_stock_level AND t.status='active' ORDER BY tl.quantity ASC LIMIT 10`).all(),
    c.env.DB.prepare(`SELECT ld.*, t.name tool_name, t.sku, w.name worker_name, w.phone
      FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN workers w ON w.id=ld.worker_id
      WHERE ld.actual_return_date IS NULL AND ld.status='active' AND ld.expected_return_date < ?
      ORDER BY ld.expected_return_date ASC LIMIT 10`).bind(n).all(),
    c.env.DB.prepare(`SELECT sm.*, t.name tool_name, t.sku, l.name loc_name
      FROM stock_movements sm JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id
      ORDER BY sm.performed_at DESC LIMIT 10`).all()
  ]);
  return c.json({
    tools_total: tools, workers_total: workers, active_loans: loans,
    overdue, low_stock: low, movements_today: todayMvs,
    low_items: lowItems.results, overdue_items: overdueItems.results,
    recent_movements: recentMvs.results
  });
});

analytics.get('/stock-report', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.sku, t.name, t.category, t.brand, l.name loc_name,
      tl.quantity, tl.min_stock_level, tl.reserved_quantity, tl.max_stock_level,
      CASE WHEN tl.quantity <= 0 THEN 'out' WHEN tl.quantity <= tl.min_stock_level THEN 'low' ELSE 'ok' END stock_status
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
     WHERE t.status='active' ORDER BY t.name, l.name`
  ).all();
  return c.json(results);
});

analytics.get('/worker-holdings', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT w.id worker_id, w.name worker_name, w.phone, w.company, w.worker_type,
      (SELECT COUNT(*) FROM lending WHERE worker_id=w.id AND status='completed') returned_loans,
      (SELECT COUNT(*) FROM lending WHERE worker_id=w.id) total_loans,
      t.sku, t.name tool_name, t.category, l.name loc_name,
      ld.quantity, ld.date_out, ld.expected_return_date, ld.id loan_id,
      CASE WHEN ld.expected_return_date < ? AND ld.actual_return_date IS NULL THEN 1 ELSE 0 END overdue
     FROM lending ld
     JOIN workers w ON w.id=ld.worker_id JOIN tools t ON t.id=ld.tool_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.actual_return_date IS NULL AND ld.status='active' ORDER BY w.name, t.name`
  ).bind(Date.now()).all();

  const workersMap = {};
  results.forEach(r => {
    if (!workersMap[r.worker_id]) {
      const total = r.total_loans || 0;
      const rel = total > 0 ? (r.returned_loans / total) * 100 : null;
      workersMap[r.worker_id] = {
        worker_id: r.worker_id,
        worker_name: r.worker_name,
        phone: r.phone,
        company: r.company || '',
        reliability_score: rel,
        loans: []
      };
    }
    workersMap[r.worker_id].loans.push({
      id: r.loan_id,
      sku: r.sku,
      tool_name: r.tool_name,
      category: r.category,
      loc_name: r.loc_name,
      quantity: r.quantity,
      date_out: r.date_out,
      expected_return_date: r.expected_return_date,
      overdue: r.overdue
    });
  });

  return c.json(Object.values(workersMap));
});

function now() { return Date.now(); }

export default analytics;
