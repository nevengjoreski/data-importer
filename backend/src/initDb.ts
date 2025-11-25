import sequelize from './database';

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

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
