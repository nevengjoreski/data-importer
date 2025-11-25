import sequelize from '../../src/database';
import Record from '../../src/models/Record';
import { rateLimiter } from '../../src/middleware/rateLimiter';

// Setup before all tests
beforeAll(async () => {
  // Sync database (creates tables if they don't exist)
  await sequelize.sync({ force: true });
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});

// Clear data between tests
beforeEach(async () => {
  await Record.destroy({ where: {}, truncate: true });
  rateLimiter.reset();
});
