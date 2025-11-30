import fs from 'fs';
import csv from 'csv-parser';
import { rateLimiter } from '../middleware/rateLimiter';
import Record from '../models/Record';
import ImportJob from '../models/ImportJob';
import ImportError from '../models/ImportError';
import { ValidationError, Op } from 'sequelize';
import { z } from 'zod';
import { ImportRecordData } from '../types/import';

export class ImportService {
    private static instance: ImportService;

    private constructor() { }

    static getInstance(): ImportService {
        if (!ImportService.instance) {
            ImportService.instance = new ImportService();
        }
        return ImportService.instance;
    }

    async startImportBatch(jobId: number, records: ImportRecordData[]) {
        try {
            await this.processBatchAndInsert(jobId, records);
            this.processJob(jobId).catch(err => {
                console.error(`Fatal error processing job ${jobId}:`, err);
            });
        } catch (error) {
            console.error('Error in startImportBatch:', error);
            const job = await ImportJob.findByPk(jobId);
            if (job) {
                job.status = 'failed';
                job.completedAt = new Date();
                await job.save();
            }
        }
    }

    async startImportStream(jobId: number, filePath: string) {
        const BATCH_SIZE = 500;
        let batch: any[] = [];

        const job = await ImportJob.findByPk(jobId);
        if (!job) {
            console.error(`Job ${jobId} not found`);
            return;
        }

        const stream = fs.createReadStream(filePath).pipe(csv());

        for await (const row of stream) {
            batch.push(row);
            if (batch.length >= BATCH_SIZE) {
                await this.processBatchAndInsert(jobId, batch);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await this.processBatchAndInsert(jobId, batch);
        }
        await job.reload();
        const validPendingRecords = await Record.count({ where: { job_id: jobId } });

        job.total_records = validPendingRecords + job.processed_count;
        await job.save();
        this.processJob(jobId).catch(err => {
            console.error(`Fatal error processing job ${jobId}:`, err);
        });
    }

    private async processJob(jobId: number) {
        const job = await ImportJob.findByPk(jobId);
        if (!job) return;

        job.status = 'processing';
        await job.save();

        const BATCH_SIZE = 50;

        while (true) {
            const pendingRecords = await Record.findAll({
                where: { job_id: jobId, status: 'pending' },
                limit: BATCH_SIZE
            });

            if (pendingRecords.length === 0) break;

            const savePromises: Promise<any>[] = [];

            for (const record of pendingRecords) {
                await this.processRecordLogic(job, record);

                savePromises.push(record.save());
            }

            await Promise.all(savePromises);

            await job.save();
        }

        job.status = 'completed';
        job.completedAt = new Date();
        await job.save();
    }

    private async processRecordLogic(job: ImportJob, record: Record) {

        const recordSchema = z.object({
            name: z.string().min(1).max(255),
            email: z.email(),
            company: z.string().min(1).max(255)
        });

        const validationResult = recordSchema.safeParse({
            name: record.name,
            email: record.email,
            company: record.company
        });

        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues
                .map(issue => `${issue.path.map(String).join('.')}: ${issue.message}`)
                .join(', ');

            await this.failRecord(job, record, errorMessage);
            return;
        }

        while (!rateLimiter.canProcess()) {
            const retryAfter = rateLimiter.getRetryAfter();
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }

        const MAX_RETRIES = 5;
        let attempt = 0;
        let success = false;

        while (attempt < MAX_RETRIES && !success) {
            try {
                attempt++;

                record.status = 'success';
                record.response = {
                    success: true,
                    message: 'Processed successfully',
                    timestamp: new Date().toISOString()
                };

                job.processed_count += 1;
                job.success_count += 1;
                success = true;

            } catch (error: any) {

                const isRateLimit = error.response?.status === 429;
                const isServerErr = error.response?.status >= 500;

                if ((isRateLimit || isServerErr) && attempt < MAX_RETRIES) {
                    let waitTimeMs = 1000;

                    const retryHeader = error.response?.headers?.['retry-after'];

                    if (retryHeader) {
                        waitTimeMs = Number.parseInt(retryHeader, 10) * 1000;
                    } else {
                        waitTimeMs = 1000 * Math.pow(2, attempt - 1);
                    }

                    console.warn(`Hit 429/5xx. Retrying attempt ${attempt} in ${waitTimeMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTimeMs));

                    continue;
                }
                await this.failRecord(job, record, error.message || 'Unknown error');
                return;
            }
        }
    }

    private async failRecord(job: ImportJob, record: Record, message: string) {
        record.status = 'failed';
        record.response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };

        job.processed_count += 1;
        job.failed_count += 1;

        await ImportError.create({
            job_id: job.id,
            record_data: JSON.stringify({ name: record.name, email: record.email }),
            error_message: message
        });
    }


    private async processBatchAndInsert(jobId: number, rows: any[]) {
        if (rows.length === 0) return;

        const validRows: any[] = [];
        const invalidRows: any[] = [];

        rows.forEach(rawRow => {
            const normalized = this.normalizeRow(rawRow);
            if (normalized?.email) {
                validRows.push(normalized);
            } else if (rawRow && Object.keys(rawRow).length > 0) {
                invalidRows.push(rawRow);
            }
        });

        let failedCountToAdd = 0;

        if (invalidRows.length > 0) {
            const errorData = invalidRows.map(badRow => ({
                job_id: jobId,
                record_data: JSON.stringify(badRow),
                error_message: 'Missing or empty email address'
            }));
            await ImportError.bulkCreate(errorData);
            failedCountToAdd += invalidRows.length;
        }

        if (validRows.length === 0) {
            if (failedCountToAdd > 0) {
                const job = await ImportJob.findByPk(jobId);
                if (job) {
                    await job.increment({
                        'failed_count': failedCountToAdd,
                        'processed_count': failedCountToAdd
                    });
                }
            }
            return;
        }

        const batchEmails = validRows.map(r => r.email);
        const existingRecords = await Record.findAll({
            where: { email: { [Op.in]: batchEmails } },
            attributes: ['email'],
            raw: true
        });

        const existingEmailSet = new Set(existingRecords.map((r: any) => r.email));
        const duplicates: any[] = [];
        const recordsToInsert: any[] = [];

        validRows.forEach(row => {
            if (existingEmailSet.has(row.email)) {
                duplicates.push(row);
            } else {
                if (existingEmailSet.has(row.email)) {
                    duplicates.push(row);
                } else {
                    existingEmailSet.add(row.email);
                    recordsToInsert.push({
                        name: row.name,
                        email: row.email,
                        company: row.company,
                        job_id: jobId,
                        status: 'pending'
                    });
                }
            }
        });

        if (duplicates.length > 0) {
            const errorData = duplicates.map(dup => ({
                job_id: jobId,
                record_data: JSON.stringify(dup),
                error_message: 'Duplicate email address'
            }));
            await ImportError.bulkCreate(errorData);
            failedCountToAdd += duplicates.length;
        }

        if (failedCountToAdd > 0) {
            const job = await ImportJob.findByPk(jobId);
            if (job) {
                await job.increment({
                    'failed_count': failedCountToAdd,
                    'processed_count': failedCountToAdd
                });
            }
        }

        if (recordsToInsert.length > 0) {
            await Record.bulkCreate(recordsToInsert, { ignoreDuplicates: true });
        }
    }

    private normalizeRow(rawRow: any): ImportRecordData | null {
        if (!rawRow || Object.keys(rawRow).length === 0) return null;

        const cleanRow: any = {};
        Object.keys(rawRow).forEach(key => {
            const cleanKey = key.trim().toLowerCase().replace(/^\ufeff/, '');
            cleanRow[cleanKey] = rawRow[key];
        });

        const email = cleanRow.email ? String(cleanRow.email).trim().toLowerCase() : '';
        const name = cleanRow.name ? String(cleanRow.name).trim() : '';
        const company = cleanRow.company ? String(cleanRow.company).trim() : '';

        if (!email) return null;

        return { name, email, company };
    }
}

export const importService = ImportService.getInstance();