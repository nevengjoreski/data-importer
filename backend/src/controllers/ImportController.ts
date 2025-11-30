import { Context } from 'hono';
import fs from 'fs';
import path from 'path';
import ImportJob from '../models/ImportJob';
import ImportError from '../models/ImportError';
import { importService } from '../services/ImportService';
import { parseCSVLine } from '../utils/csvParser';
import { ImportRecordData } from '../types/import';

export class ImportController {
    static async startImport(c: Context) {
        try {
            let records: ImportRecordData[] = [];
            const contentType = c.req.header('Content-Type');

            if (contentType === 'application/json') {
                const body = await c.req.json();
                records = body.records;
            } else {
                return c.json({ error: 'Invalid content type' }, 400);
            }

            if (!records || !Array.isArray(records) || records.length === 0) {
                return c.json({ error: 'No records provided' }, 400);
            }

            const job = await ImportJob.create({
                total_records: records.length,
                status: 'pending'
            });

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
    }

    static async startTestDataImport(c: Context) {
        try {
            const csvPath = path.join(__dirname, '../../../frontend/src/import-data/test-data-1000.csv');

            if (!fs.existsSync(csvPath)) {
                return c.json({ error: 'Test data file not found' }, 404);
            }

            const fileContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = fileContent.split('\n').filter(line => line.trim() !== '');

            const records: ImportRecordData[] = lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                return {
                    name: values[0],
                    email: values[1],
                    company: values[2]
                };
            });

            const job = await ImportJob.create({
                total_records: records.length,
                status: 'pending'
            });

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
    }

    static async startEnterpriseBatchImport(c: Context) {
        try {
            const csvPath = path.join(__dirname, '../../../frontend/src/import-data/test-data-1000.csv');

            if (!fs.existsSync(csvPath)) {
                return c.json({ error: 'Test data file not found' }, 404);
            }

            const fileContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = fileContent.split('\n').filter(line => line.trim() !== '');

            const records: ImportRecordData[] = lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                return {
                    name: values[0],
                    email: values[1],
                    company: values[2]
                };
            });

            const job = await ImportJob.create({
                total_records: records.length,
                status: 'pending'
            });

            importService.startImportBatch(job.id, records);

            return c.json({
                success: true,
                jobId: job.id,
                message: 'Enterprise batch import started'
            }, 202);

        } catch (error) {
            console.error('Error starting enterprise batch import:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }

    static async startEnterpriseStreamImport(c: Context) {
        try {
            const csvPath = path.join(__dirname, '../../../frontend/src/import-data/test-data-1000.csv');

            if (!fs.existsSync(csvPath)) {
                return c.json({ error: 'Test data file not found' }, 404);
            }

            const job = await ImportJob.create({
                total_records: 0,
                status: 'pending'
            });

            importService.startImportStream(job.id, csvPath);

            return c.json({
                success: true,
                jobId: job.id,
                message: 'Enterprise stream import started'
            }, 202);

        } catch (error) {
            console.error('Error starting enterprise stream import:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }

    static async getHistory(c: Context) {
        try {
            const jobs = await ImportJob.findAll({
                order: [['created_at', 'DESC']]
            });
            return c.json({ success: true, data: jobs });
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }

    static async getJobStatus(c: Context) {
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
    }

    static async clearRecords(c: Context) {
        try {
            const Record = (await import('../models/Record')).default;

            await Record.destroy({ where: {}, truncate: true });

            await ImportError.destroy({ where: {}, truncate: true });

            await ImportJob.destroy({ where: {}, truncate: true });

            return c.json({
                success: true,
                message: 'All records cleared successfully'
            });
        } catch (error) {
            console.error('Error clearing records:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    }
}
