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
        // Update total records
        // Total = (Valid records in DB) + (Failed/Duplicate records we already counted)
        // We must re-fetch the job to get the latest 'processed_count' (which holds our failures)
        await job.reload();
        const validPendingRecords = await Record.count({ where: { job_id: jobId } });

        // Note: 'processed_count' at this stage contains ONLY the failures/duplicates 
        // because the successful ones are still 'pending' in the DB waiting for processJob.
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

            // OPTIMIZATION: We collect promises or modified records here
            // We do NOT await record.save() inside the loop
            const savePromises: Promise<any>[] = [];

            for (const record of pendingRecords) {
                // 1. Process logic (Wait for rate limit + API call)
                // This updates the record object in memory
                await this.processRecordLogic(job, record);

                // 2. Queue the save operation
                savePromises.push(record.save());
            }

            // 3. Execute all DB writes in parallel for this batch
            // This happens "outside" the rate limit wait time
            await Promise.all(savePromises);

            // 4. Save Job Stats once per batch
            await job.save();
        }

        job.status = 'completed';
        job.completedAt = new Date();
        await job.save();
    }

    /**
     * Refactored to only handle Logic + Rate Limiting.
     * It modifies the record instance but DOES NOT save it.
     */
    private async processRecordLogic(job: ImportJob, record: Record) {
        // --- STEP 1: VALIDATE ---
        const recordSchema = z.object({
            name: z.string().min(1).max(255),
            email: z.string().email(),
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

            this.markRecordFailedInMemory(job, record, errorMessage);

            // We must create the ImportError here immediately, 
            // but we can let it run in background or await it if strict safety is needed.
            // Awaiting it is safer to prevent race conditions on job failure counts.
            await ImportError.create({
                job_id: job.id,
                record_data: JSON.stringify({ name: record.name, email: record.email }),
                error_message: errorMessage
            });
            return;
        }

        // --- STEP 2: RATE LIMIT ---
        while (!rateLimiter.canProcess()) {
            const retryAfter = rateLimiter.getRetryAfter();
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }

        // --- STEP 3: EXECUTE ---
        try {
            // Simulated Success
            record.status = 'success';
            record.response = {
                success: true,
                message: 'Processed successfully',
                timestamp: new Date().toISOString()
            };

            job.processed_count += 1;
            job.success_count += 1;

        } catch (error: any) {
            this.markRecordFailedInMemory(job, record, error.message || 'Unknown error');
            await ImportError.create({
                job_id: job.id,
                record_data: JSON.stringify({ name: record.name, email: record.email }),
                error_message: error.message
            });
        }
    }

    // Updates state in memory, used by the batch saver later
    private markRecordFailedInMemory(job: ImportJob, record: Record, message: string) {
        record.status = 'failed';
        record.response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };
        job.processed_count += 1;
        job.failed_count += 1;
    }

    private async processBatchAndInsert(jobId: number, rows: any[]) {
        if (rows.length === 0) return;

        const validRows: any[] = [];
        const invalidRows: any[] = [];

        // 1. Normalize
        rows.forEach(rawRow => {
            const normalized = this.normalizeRow(rawRow);
            if (normalized?.email) {
                validRows.push(normalized);
            } else if (rawRow && Object.keys(rawRow).length > 0) {
                invalidRows.push(rawRow);
            }
        });

        // 2. Prepare Errors for invalid rows
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
            // OPTIMIZATION: Update job stats for invalids and exit
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

        // 3. Check Duplicates
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

        // 4. Handle Duplicates
        if (duplicates.length > 0) {
            const errorData = duplicates.map(dup => ({
                job_id: jobId,
                record_data: JSON.stringify(dup),
                error_message: 'Duplicate email address'
            }));
            await ImportError.bulkCreate(errorData);
            failedCountToAdd += duplicates.length;
        }

        // 5. OPTIMIZATION: Single DB Update for all failures (Invalid + Duplicates)
        if (failedCountToAdd > 0) {
            const job = await ImportJob.findByPk(jobId);
            if (job) {
                await job.increment({
                    'failed_count': failedCountToAdd,
                    'processed_count': failedCountToAdd
                });
            }
        }

        // 6. Bulk Create Valid
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

export const enterpriseImportService = EnterpriseImportService.getInstance();