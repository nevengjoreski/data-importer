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
            // REFACTOR: Use the helper method instead of raw bulkCreate
            // This ensures duplicates are checked, separated, and logged exactly like the stream does.
            await this.processBatchAndInsert(jobId, records);

            // 2. Start background processing
            this.processJob(jobId).catch(err => {
                console.error(`Fatal error processing job ${jobId}:`, err);
            });

        } catch (error) {
            console.error('Error in startImportBatch:', error);
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

        const stream = fs.createReadStream(filePath).pipe(csv());

        for await (const row of stream) {
            batch.push(row);
            if (batch.length >= BATCH_SIZE) {
                await this.processBatchAndInsert(jobId, batch);
                batch = []; // Clear memory
            }
        }

        // Process remaining
        if (batch.length > 0) {
            await this.processBatchAndInsert(jobId, batch);
        }

        // Start background processing
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
            // 1. Fetch batch of PENDING records
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

            // 2. Process the batch
            for (const record of pendingRecords) {
                // We await here to respect the Rate Limiter sequentially
                await this.processRecord(job, record);
            }

            // 3. OPTIMIZATION: Save Job Stats once per batch
            // Instead of saving the Job model 50 times (once per record), 
            // we save it once after the batch is done.
            await job.save();
        }

        // 4. Final completion
        job.status = 'completed';
        await job.save();
    }

    private async processRecord(job: ImportJob, record: Record) {
        // --- STEP 1: VALIDATE (Cost: 0ms) ---
        // Validate locally first. If invalid, fail immediately without waiting for rate limiter.
        const recordSchema = z.object({
            name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
            email: z.string().email('Invalid email format'),
            company: z.string().min(1, 'Company is required').max(255, 'Company is too long')
        });

        const validationResult = recordSchema.safeParse({
            name: record.name,
            email: record.email,
            company: record.company
        });

        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues
                .map(issue => {
                    const path = issue.path.map(String).join('.');
                    return `${path}: ${issue.message}`;
                })
                .join(', ');

            await this.markRecordFailed(job, record, errorMessage);
            return;
        }

        // --- STEP 2: RATE LIMIT CHECK (Cost: Wait Time) ---
        // Only valid records reach this point.
        while (!rateLimiter.canProcess()) {
            const retryAfter = rateLimiter.getRetryAfter();
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }

        try {
            // --- STEP 3: EXECUTE (Simulated External API) ---

            // Mark as Success
            record.status = 'success';
            record.response = {
                success: true,
                message: 'Processed successfully',
                timestamp: new Date().toISOString()
            };
            await record.save();

            // Update stats in memory (saved to DB in processJob loop)
            job.processed_count += 1;
            job.success_count += 1;

        } catch (error: any) {
            // Handle API Errors (e.g. 500 server error from external API)
            await this.markRecordFailed(job, record, error.message || 'Unknown error');
        }
    }

    // New Helper to reduce code duplication
    private async markRecordFailed(job: ImportJob, record: Record, message: string) {
        record.status = 'failed';
        record.response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        };
        await record.save();

        // Update stats in memory
        job.processed_count += 1;
        job.failed_count += 1;

        // Log the error detail
        await ImportError.create({
            job_id: job.id,
            record_data: JSON.stringify({
                name: record.name,
                email: record.email,
                company: record.company
            }),
            error_message: message,
        });
    }

    private async processBatchAndInsert(jobId: number, rows: any[]) {
        if (rows.length === 0) return;

        const validRows: any[] = [];
        const invalidRows: any[] = [];

        rows.forEach(rawRow => {
            // STEP 1: Normalize the messy input (CSV or JSON) into a standard shape
            const normalized = this.normalizeRow(rawRow);

            // STEP 2: Check validity
            // If normalize returned a record, but email is empty string -> Invalid
            if (normalized?.email) {
                validRows.push(normalized);
            } else {
                // If it was a total ghost row (null), we might ignore it 
                // OR if it was a row with missing email, we log it.

                // If rawRow was not empty but result has no email, it's a "Missing Value" error
                if (rawRow && Object.keys(rawRow).length > 0) {
                    invalidRows.push(rawRow);
                }
            }
        });

        // 1. Log errors for Invalid/Empty Rows immediately
        if (invalidRows.length > 0) {
            const errorData = invalidRows.map(badRow => ({
                job_id: jobId,
                record_data: JSON.stringify(badRow),
                error_message: 'Missing or empty email address'
            }));

            await ImportError.bulkCreate(errorData);

            // Update stats
            const job = await ImportJob.findByPk(jobId);
            if (job) {
                await job.increment('failed_count', { by: invalidRows.length });
            }
        }

        // Stop if no valid rows left
        if (validRows.length === 0) return;
        // --- FIX END ---

        // 2. Extract emails from the VALID batch
        const batchEmails = validRows.map(r => r.email);

        // 3. Find which emails ALREADY exist in the DB
        const existingRecords = await Record.findAll({
            where: {
                email: {
                    [Op.in]: batchEmails
                }
            },
            attributes: ['email'],
            raw: true
        });

        const existingEmailSet = new Set(existingRecords.map((r: any) => r.email));

        // 4. Separate duplicates from new records
        const duplicates: any[] = [];
        const recordsToInsert: any[] = [];

        validRows.forEach(row => {
            if (existingEmailSet.has(row.email)) {
                duplicates.push(row);
            } else {
                // Determine if we have duplicates *within the batch itself*
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

        // 5. Log errors for duplicates
        if (duplicates.length > 0) {
            const errorData = duplicates.map(dup => ({
                job_id: jobId,
                record_data: JSON.stringify(dup),
                error_message: 'Duplicate email address'
            }));

            await ImportError.bulkCreate(errorData);

            const job = await ImportJob.findByPk(jobId);
            if (job) {
                await job.increment('failed_count', { by: duplicates.length });
            }
        }

        // 6. Bulk Create valid ones
        if (recordsToInsert.length > 0) {
            await Record.bulkCreate(recordsToInsert, { ignoreDuplicates: true });
        }
    }

    private normalizeRow(rawRow: any): ImportRecordData | null {
        // 1. Handle "Ghost Rows" (empty objects)
        if (!rawRow || Object.keys(rawRow).length === 0) return null;

        // 2. Normalize Keys (Handle 'Email' vs 'email' vs 'EMAIL')
        // We create a new object with lowercase keys
        const cleanRow: any = {};
        Object.keys(rawRow).forEach(key => {
            const cleanKey = key.trim().toLowerCase().replace(/^\ufeff/, ''); // Remove BOM
            cleanRow[cleanKey] = rawRow[key];
        });

        // 3. Extract and Clean Values
        const email = cleanRow.email ? String(cleanRow.email).trim().toLowerCase() : '';
        const name = cleanRow.name ? String(cleanRow.name).trim() : '';
        const company = cleanRow.company ? String(cleanRow.company).trim() : '';

        // 4. Strict Validation (Fail immediately if empty)
        if (!email) return null; // Will be caught as "Missing Value" later if we return null here? 
        // Better strategy: Return the object with empty string so the validator catches it properly.

        return {
            name,
            email,
            company
        };
    }
}

export const enterpriseImportService = EnterpriseImportService.getInstance();
