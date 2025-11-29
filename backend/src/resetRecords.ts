import sequelize from './database';
import Record from './models/Record';
import ImportJob from './models/ImportJob';
import ImportError from './models/ImportError';

async function resetRecords() {
    try {
        await sequelize.authenticate();
        // Delete all records but keep jobs for history (optional, but cleaner to reset all for test)
        // Actually, let's reset everything to be sure.
        await sequelize.sync({ force: true });
        console.log('Database reset successfully.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await sequelize.close();
    }
}

resetRecords();
