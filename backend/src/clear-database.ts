import sequelize from './database';
import Record from './models/Record';
import ImportError from './models/ImportError';
import ImportJob from './models/ImportJob';

async function clearDatabase() {
    try {
        console.log('Clearing database...');

        // Delete in order to respect foreign key constraints
        // 1. Records (references import_jobs)
        const recordsDeleted = await Record.destroy({ where: {}, truncate: true });
        console.log(`✓ Deleted ${recordsDeleted} records`);

        // 2. Import Errors (references import_jobs)
        const errorsDeleted = await ImportError.destroy({ where: {}, truncate: true });
        console.log(`✓ Deleted ${errorsDeleted} import errors`);

        // 3. Import Jobs (no dependencies)
        const jobsDeleted = await ImportJob.destroy({ where: {}, truncate: true });
        console.log(`✓ Deleted ${jobsDeleted} import jobs`);

        console.log('\n✅ Database cleared successfully!');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
}

clearDatabase();
