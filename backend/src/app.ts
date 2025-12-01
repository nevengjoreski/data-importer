import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from './routes';

const app = new Hono();

// Middleware
app.use('*', cors());

// API routes
app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/api', routes);

export default app;
