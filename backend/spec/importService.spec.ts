import 'jasmine';
import { ImportService } from '../src/services/ImportService';
import ImportJob from '../src/models/ImportJob';
import Record from '../src/models/Record';
import ImportError from '../src/models/ImportError';
import { rateLimiter } from '../src/middleware/rateLimiter';
import sequelize from '../src/database';

describe('ImportService', () => {
    let importService: ImportService;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
        importService = ImportService.getInstance();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(async () => {
        await ImportJob.destroy({ where: {} });
        await Record.destroy({ where: {} });
        await ImportError.destroy({ where: {} });
        rateLimiter.reset();
    });

    it('should process all records successfully', async () => {
        const records = [
            { name: 'User 1', email: 'user1@example.com', company: 'Corp 1' },
            { name: 'User 2', email: 'user2@example.com', company: 'Corp 2' }
        ];

        const job = await ImportJob.create({
            total_records: records.length,
            status: 'pending'
        });

        await importService.startImport(job.id, records);

        // Wait for processing (since startImport is async fire-and-forget)
        // In a real test we might want to await the private processJob or poll
        // But since we can access the private method via 'any' or just wait:
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedJob = await ImportJob.findByPk(job.id);
        expect(updatedJob?.status).toBe('completed');
        expect(updatedJob?.processed_count).toBe(2);
        expect(updatedJob?.success_count).toBe(2);
        expect(updatedJob?.failed_count).toBe(0);

        const savedRecords = await Record.findAll();
        expect(savedRecords.length).toBe(2);
    });

    it('should handle duplicate emails as errors', async () => {
        // First insert a record
        await Record.create({
            name: 'Existing User',
            email: 'duplicate@example.com',
            company: 'Existing Corp'
        });

        const records = [
            { name: 'New User', email: 'new@example.com', company: 'New Corp' },
            { name: 'Duplicate User', email: 'duplicate@example.com', company: 'Other Corp' }
        ];

        const job = await ImportJob.create({
            total_records: records.length,
            status: 'pending'
        });

        await importService.startImport(job.id, records);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedJob = await ImportJob.findByPk(job.id);
        expect(updatedJob?.status).toBe('completed');
        expect(updatedJob?.processed_count).toBe(2);
        expect(updatedJob?.success_count).toBe(1);
        expect(updatedJob?.failed_count).toBe(1);

        const errors = await ImportError.findAll({ where: { job_id: job.id } });
        expect(errors.length).toBe(1);
        expect(errors[0].error_message).toContain('email must be unique');
    });

    it('should respect rate limits (slow down processing)', async () => {
        // Mock rate limiter to be exhausted initially
        spyOn(rateLimiter, 'canProcess').and.returnValues(false, false, true);
        spyOn(rateLimiter, 'getRetryAfter').and.returnValue(0.1); // Short wait for test

        const records = [
            { name: 'User 1', email: 'user1@example.com', company: 'Corp 1' }
        ];

        const job = await ImportJob.create({
            total_records: records.length,
            status: 'pending'
        });

        const startTime = Date.now();
        await importService.startImport(job.id, records);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait enough for retries

        const updatedJob = await ImportJob.findByPk(job.id);
        expect(updatedJob?.status).toBe('completed');

        // We expect some delay due to retries
        // This is a loose check but ensures we didn't just fail immediately
        expect(rateLimiter.canProcess).toHaveBeenCalledTimes(3);
    });
});
