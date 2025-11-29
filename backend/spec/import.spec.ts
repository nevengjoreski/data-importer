import 'jasmine';
import app from '../src/app';
import sequelize from '../src/database';
import ImportJob from '../src/models/ImportJob';
import { rateLimiter } from '../src/middleware/rateLimiter';

describe('Import API', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(() => {
        rateLimiter.reset();
    });

    it('should start an import job', async () => {
        const records = [
            { name: 'Test 1', email: 'test1@example.com', company: 'Company 1' },
            { name: 'Test 2', email: 'test2@example.com', company: 'Company 2' }
        ];

        const req = new Request('http://localhost/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records })
        });

        const res = await app.request(req);
        expect(res.status).toBe(202);

        const body = await res.json() as any;
        expect(body.success).toBe(true);
        expect(body.jobId).toBeDefined();

        // Verify job created
        const job = await ImportJob.findByPk(body.jobId);
        expect(job).toBeDefined();
        expect(job?.total_records).toBe(2);
        expect(job?.status).toMatch(/pending|processing|completed/);
    });

    it('should handle invalid input', async () => {
        const req = new Request('http://localhost/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: [] })
        });

        const res = await app.request(req);
        expect(res.status).toBe(400);
    });
});
