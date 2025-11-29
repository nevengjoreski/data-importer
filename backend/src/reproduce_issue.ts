import sequelize from './database';
import Record from './models/Record';
import ImportJob from './models/ImportJob';

async function reproduce() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Create a dummy record
        await Record.create({
            name: 'Test Record',
            email: 'test@example.com',
            company: 'Test Co'
        });

        // Create a dummy job
        await ImportJob.create({
            total_records: 1,
            status: 'completed'
        });

        console.log('Created test record and job.');

        const countRecordsBefore = await Record.count();
        const countJobsBefore = await ImportJob.count();
        console.log(`Records before: ${countRecordsBefore}, Jobs before: ${countJobsBefore}`);

        // Try to delete all
        await Record.destroy({ where: {} });
        await ImportJob.destroy({ where: {} });
        console.log('Executed destroy({ where: {} }) for both.');

        const countRecordsAfter = await Record.count();
        const countJobsAfter = await ImportJob.count();
        console.log(`Records after: ${countRecordsAfter}, Jobs after: ${countJobsAfter}`);

        if (countRecordsAfter === 0 && countJobsAfter === 0) {
            console.log('SUCCESS: All cleared.');
        } else {
            console.log('FAILURE: Not all cleared.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

reproduce();
