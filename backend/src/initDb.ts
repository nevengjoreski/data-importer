import sequelize from './database';
import './models/Record';
import './models/ImportJob';
import './models/ImportError';

async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models (force: true drops existing tables and recreates them)
    await sequelize.sync({ force: true });

    console.log('✅ Database initialized successfully!');
    console.log('Table created:');
    console.log('  - records: stores all imported records');
    console.log('  - import_jobs: stores import job status');
    console.log('  - import_errors: stores import errors');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
