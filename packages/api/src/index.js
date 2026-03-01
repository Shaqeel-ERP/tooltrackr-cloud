import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

import authRoutes      from './routes/auth.js';
import toolRoutes      from './routes/tools.js';
import stockRoutes     from './routes/stock.js';
import workerRoutes    from './routes/workers.js';
import lendingRoutes   from './routes/lending.js';
import transferRoutes  from './routes/transfers.js';
import purchaseRoutes  from './routes/purchases.js';
import supplierRoutes  from './routes/suppliers.js';
import locationRoutes  from './routes/locations.js';
import analyticsRoutes from './routes/analytics.js';
import auditRoutes     from './routes/audit.js';
import importRoutes    from './routes/import.js';
import userRoutes      from './routes/users.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Public routes
app.route('/api/auth', authRoutes);

// JWT guard
app.use('/api/*', async (c, next) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next);
});

app.route('/api/tools',      toolRoutes);
app.route('/api/stock',      stockRoutes);
app.route('/api/workers',    workerRoutes);
app.route('/api/lending',    lendingRoutes);
app.route('/api/transfers',  transferRoutes);
app.route('/api/purchases',  purchaseRoutes);
app.route('/api/suppliers',  supplierRoutes);
app.route('/api/locations',  locationRoutes);
app.route('/api/analytics',  analyticsRoutes);
app.route('/api/audit',      auditRoutes);
app.route('/api/import',     importRoutes);
app.route('/api/users',      userRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => { console.error(err); return c.json({ error: err.message }, 500); });

export default app;
