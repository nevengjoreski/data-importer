import fs from 'fs';
import csv from 'csv-parser';
import { rateLimiter } from '../middleware/rateLimiter';
import Record from '../models/Record';
import ImportJob from '../models/ImportJob';
import ImportError from '../models/ImportError';
import { ValidationError, Op } from 'sequelize';
import { z } from 'zod';

import { ImportRecordData } from '../types/import';

export class EnterpriseImportService {
    private static instance: EnterpriseImportService;

    private constructor() { }

    static getInstance(): EnterpriseImportService {
        if (!EnterpriseImportService.instance) {
            EnterpriseImportService.instance = new EnterpriseImportService();
        }
        return EnterpriseImportService.instance;
    }

    async startImportBatch(jobId: number, records: ImportRecordData[]) {
        try {
            // 1. Bulk insert PENDING records
            const recordsToInsert = records.map(r => ({
                name: r.name,
                email: r.email,
                company: r.company,
                job_id: jobId,
                status: 'pending'
            }));

            // Use chunking for large inserts if necessary, but sequelize bulkCreate handles it reasonably well
            // ignoreDuplicates: skip records with duplicate emails (from CSV or existing in DB)
            await Record.bulkCreate(recordsToInsert as any, { ignoreDuplicates: true });

            // 2. Start background processing
            this.processJob(jobId).catch(err => {
                console.error(`Fatal error processing job ${jobId}:`, err);
            });

        } catch (error) {
            console.error('Error in startImportBatch:', error);
            // If bulk insert fails, mark job as failed
            const job = await ImportJob.findByPk(jobId);
            if (job) {
                job.status = 'failed';
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

        const processBatch = async (currentBatch: any[]) => {
            const recordsToInsert = currentBatch.map(r => ({
                name: r.name,
                email: r.email,
                company: r.company,
                job_id: jobId,
                status: 'pending'
            }));
            await Record.bulkCreate(recordsToInsert as any, { ignoreDuplicates: true });
        };

        const stream = fs.createReadStream(filePath)
            .pipe(csv());

        for await (const row of stream) {
            batch.push(row);
            if (batch.length >= BATCH_SIZE) {
                await processBatch(batch);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await processBatch(batch);
        }

        // Start background processing after loading all pending records
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
            // Fetch batch of PENDING records
            const pendingRecords = await Record.findAll({
                where: {
                    job_id: jobId,
                    status: 'pending'
                },
                limit: BATCH_SIZE
            });

            if (pendingRecords.length === 0) {
                break;
            }

            for (const record of pendingRecords) {
                await this.processRecord(job, record);
            }

            // Update job stats periodically (after each batch)
            await job.save();
        }

        // Final save
        job.status = 'completed';
        await job.save();
    }

    private async processRecord(job: ImportJob, record: Record) {
        // 1. Check rate limit
        while (!rateLimiter.canProcess()) {
            const retryAfter = rateLimiter.getRetryAfter();
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }

        try {
            // 2. Validate data using Zod
            const recordSchema = z.object({
                name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
                email: z.string().email('Invalid email format'),
                company: z.string().min(1, 'Company is required').max(255, 'Company is too long')
            });

            // Validate the record data
            recordSchema.parse({
                name: record.name,
                email: record.email,
                company: record.company
            });

            // 3. Mark as Success
            record.status = 'success';
            record.response = { success: true, message: 'Processed successfully', timestamp: new Date().toISOString() };
            await record.save();

            job.processed_count += 1;
            job.success_count += 1;

        } catch (error: any) {
            // 4. Handle Failure
            record.status = 'failed';
            record.response = { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
            await record.save();

            job.processed_count += 1;
            job.failed_count += 1;

            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            await ImportError.create({
                job_id: job.id,
                record_data: JSON.stringify({ name: record.name, email: record.email, company: record.company }),
                error_message: errorMessage,
            });
        }
    }
}

export const enterpriseImportService = EnterpriseImportService.getInstance();
