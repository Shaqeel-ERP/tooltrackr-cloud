import { Hono } from 'hono';
const reports = new Hono();

// 1. Stock Levels
reports.get('/stock-levels', async (c) => {
    const { results } = await c.env.DB.prepare(`
    SELECT
      t.sku, t.name, t.category,
      l.name as location_name,
      tl.quantity as total,
      tl.reserved_quantity as reserved,
      (tl.quantity - tl.reserved_quantity) as available,
      tl.min_stock_level,
      MAX(sm.performed_at) as last_movement
    FROM tool_locations tl
    JOIN tools t ON tl.tool_id = t.id
    JOIN locations l ON tl.location_id = l.id
    LEFT JOIN stock_movements sm ON sm.tool_id = t.id AND sm.location_id = l.id
    GROUP BY tl.id
    ORDER BY t.name ASC
  `).all();
    return c.json(results);
});

// 2. Worker Holdings
reports.get('/worker-holdings', async (c) => {
    const { results } = await c.env.DB.prepare(`
    SELECT
      w.id, w.name, w.phone, w.company, w.worker_type as department,
      COUNT(CASE WHEN ld.status = 'active' AND ld.actual_return_date IS NULL THEN 1 END) as active_loan_count,
      COUNT(ld.id) as total_loans,
      COUNT(CASE WHEN ld.status = 'returned' AND ld.actual_return_date <= ld.expected_return_date THEN 1 END) as on_time_returns,
      COUNT(CASE WHEN ld.status = 'active' AND ld.actual_return_date IS NULL AND ld.expected_return_date < ? THEN 1 END) as overdue_count
    FROM workers w
    LEFT JOIN lending ld ON ld.worker_id = w.id
    GROUP BY w.id
    ORDER BY active_loan_count DESC
  `).bind(Date.now()).all();

    // also fetch tools held by them for the accordion
    const { results: loans } = await c.env.DB.prepare(`
    SELECT ld.id, ld.worker_id, t.name as tool_name, t.sku,
           ld.quantity, ld.date_out, ld.expected_return_date, ld.status
    FROM lending ld
    JOIN tools t ON ld.tool_id = t.id
    WHERE ld.status = 'active' AND ld.actual_return_date IS NULL
  `).all();

    const loansByWorker = {};
    for (const l of loans) {
        if (!loansByWorker[l.worker_id]) loansByWorker[l.worker_id] = [];
        loansByWorker[l.worker_id].push(l);
    }

    const enhancedResults = results.map(r => ({
        ...r,
        loans: loansByWorker[r.id] || []
    }));

    return c.json({ workers: enhancedResults });
});

// 3. Loan History
reports.get('/loan-history', async (c) => {
    const { startDate, endDate } = c.req.query();
    // Provide defaults if missing
    const sDate = startDate ? parseInt(startDate) : 0;
    const eDate = endDate ? parseInt(endDate) : Date.now() * 2; // future

    const { results } = await c.env.DB.prepare(`
    SELECT
      ld.id,
      t.name as tool_name, t.sku,
      w.name as worker_name, w.phone as worker_phone,
      l.name as location_name,
      ld.date_out as issued_date, ld.expected_return_date as due_date, ld.actual_return_date as returned_at,
      ld.status, ld.return_condition,
      ld.issued_by,
      CASE
        WHEN ld.actual_return_date IS NOT NULL
          THEN ROUND((ld.actual_return_date - ld.date_out) / 86400000.0)
        ELSE
          ROUND((? - ld.date_out) / 86400000.0)
      END as days_out
    FROM lending ld
    JOIN tools t ON ld.tool_id = t.id
    JOIN workers w ON ld.worker_id = w.id
    JOIN locations l ON ld.location_id = l.id
    WHERE ld.date_out >= ? AND ld.date_out <= ?
    ORDER BY ld.date_out DESC
    LIMIT 500
  `).bind(Date.now(), sDate, eDate).all();
    return c.json(results);
});

// 4. Movements
reports.get('/movements', async (c) => {
    const { startDate, endDate } = c.req.query();
    // Provide defaults if missing
    const sDate = startDate ? parseInt(startDate) : 0;
    const eDate = endDate ? parseInt(endDate) : Date.now() * 2; // future

    // Wait, the prompt SQL had quantity_before, quantity_after, but stock_movements does not have them.
    // Let's use standard stock_movements columns: quantity, movement_type
    const { results } = await c.env.DB.prepare(`
    SELECT
      sm.id, sm.performed_at as created_at, sm.movement_type,
      t.name as tool_name, t.sku,
      l.name as location_name,
      sm.quantity as quantity_change,
      sm.notes, sm.reference_id,
      sm.performed_by as created_by
    FROM stock_movements sm
    JOIN tools t ON sm.tool_id = t.id
    JOIN locations l ON sm.location_id = l.id
    WHERE sm.performed_at >= ? AND sm.performed_at <= ?
    ORDER BY sm.performed_at DESC
  `).bind(sDate, eDate).all();
    return c.json(results);
});

// 5. Transfers
reports.get('/transfers', async (c) => {
    const { startDate, endDate } = c.req.query();
    // Provide defaults if missing
    const sDate = startDate ? parseInt(startDate) : 0;
    const eDate = endDate ? parseInt(endDate) : Date.now() * 2; // future

    const { results } = await c.env.DB.prepare(`
    SELECT
      tr.id, t.name as tool_name, t.sku,
      ti.requested_quantity as quantity,
      fl.name as from_location, tl.name as to_location,
      tr.status,
      tr.notes,
      tr.requested_by,
      tr.approved_by,
      tr.created_at as requested_date,
      tr.completed_at
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    LEFT JOIN tools t ON ti.tool_id = t.id
    JOIN locations fl ON tr.from_location_id = fl.id
    JOIN locations tl ON tr.to_location_id = tl.id
    WHERE tr.created_at >= ? AND tr.created_at <= ?
    ORDER BY tr.created_at DESC
  `).bind(sDate, eDate).all();
    return c.json(results);
});

// 6. Cost Analysis (Ported existing logic)
reports.get('/cost-analysis', async (c) => {
    // 1. Overall Spend Overview
    const { results: overviewResults } = await c.env.DB.prepare(`
      SELECT
        COALESCE(SUM(p.total_amount), 0) AS total_spend,
        COALESCE(SUM(p.tax_amount), 0) AS total_tax,
        COUNT(DISTINCT p.id) AS total_pos,
        COALESCE(SUM(pi.received_quantity), 0) AS items_received
      FROM purchases p
      LEFT JOIN purchase_items pi ON pi.purchase_id = p.id;
    `).all();

    // 2. Spend by supplier
    const { results: bySupplier } = await c.env.DB.prepare(`
      SELECT s.name AS supplier_name, COUNT(DISTINCT p.id) AS order_count,
        COALESCE(SUM(p.total_amount), 0) AS total_spent
      FROM purchases p JOIN suppliers s ON p.supplier_id = s.id
      GROUP BY p.supplier_id ORDER BY total_spent DESC;
    `).all();

    // 3. Spend by category
    const { results: byCategory } = await c.env.DB.prepare(`
      SELECT t.category, COUNT(pi.id) AS item_count,
        COALESCE(SUM(pi.total_cost), 0) AS total_cost
      FROM purchase_items pi JOIN tools t ON pi.tool_id = t.id
      GROUP BY t.category ORDER BY total_cost DESC;
    `).all();

    return c.json({
        overview: overviewResults[0] || { total_spend: 0, total_tax: 0, total_pos: 0, items_received: 0 },
        bySupplier,
        byCategory
    });
});

export default reports;
