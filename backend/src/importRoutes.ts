import { Hono } from 'hono';
import ImportJob from './models/ImportJob';
import ImportError from './models/ImportError';
import { importService } from './services/ImportService';
import fs from 'fs';
import path from 'path';

const importRoutes = new Hono();

// Helper to parse CSV line
const parseCSVLine = (line: string) => {
    // Simple CSV parser that handles quoted strings
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue);
    return values.map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
};

importRoutes.post('/', async (c) => {
    try {
        let records = [];
        const contentType = c.req.header('Content-Type');

        if (contentType === 'application/json') {
            const body = await c.req.json();
            records = body.records;
        } else {
            // Fallback or specific endpoint for test data
            return c.json({ error: 'Invalid content type' }, 400);
        }

        if (!records || !Array.isArray(records) || records.length === 0) {
            return c.json({ error: 'No records provided' }, 400);
        }

        // Create job
        const job = await ImportJob.create({
            total_records: records.length,
            status: 'pending'
        });

        // Start processing
        importService.startImport(job.id, records);

        return c.json({
            success: true,
            jobId: job.id,
            message: 'Import started'
        }, 202);

    } catch (error) {
        console.error('Error starting import:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

importRoutes.post('/test-data', async (c) => {
    try {
        // Read test data from frontend directory (assuming local setup)
        const csvPath = path.join(__dirname, '../../frontend/src/import-data/test-data-1000.csv');

        if (!fs.existsSync(csvPath)) {
            return c.json({ error: 'Test data file not found' }, 404);
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(','); // Assuming simple headers: name,email,company

        const records = lines.slice(1).map(line => {
            const values = parseCSVLine(line);
            return {
                name: values[0],
                email: values[1],
                company: values[2]
            };
        });

        // Create job
        const job = await ImportJob.create({
            total_records: records.length,
            status: 'pending'
        });

        // Start processing
        importService.startImport(job.id, records);

        return c.json({
            success: true,
            jobId: job.id,
            message: 'Test data import started'
        }, 202);

    } catch (error) {
        console.error('Error starting test data import:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});


importRoutes.get('/', async (c) => {
    try {
        const jobs = await ImportJob.findAll({
            order: [['created_at', 'DESC']]
        });
        return c.json({ success: true, data: jobs });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

importRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');

    try {
        const job = await ImportJob.findByPk(id, {
            include: [{ model: ImportError, as: 'errors' }]
        });

        if (!job) {
            return c.json({ error: 'Job not found' }, 404);
        }

        return c.json({ success: true, data: job });
    } catch (error) {
        console.error('Error fetching job:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});


export default importRoutes;
