import { serve } from '@hono/node-server';
import sequelize from './database';

import app from './app';

const PORT = 4000;

// Initialize database and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models (won\'t drop existing tables)
    await sequelize.sync({ alter: false });

    serve({
      fetch: app.fetch,
      port: PORT,
    });

    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
