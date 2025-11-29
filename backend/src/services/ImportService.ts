import { rateLimiter } from '../middleware/rateLimiter';
import Record from '../models/Record';
import ImportJob from '../models/ImportJob';
import ImportError from '../models/ImportError';
import { ValidationError } from 'sequelize';

interface ImportRecordData {
    name: string;
    email: string;
    company: string;
}

export class ImportService {
    private static instance: ImportService;
    private isProcessing: boolean = false;

    private constructor() { }

    static getInstance(): ImportService {
        if (!ImportService.instance) {
            ImportService.instance = new ImportService();
        }
        return ImportService.instance;
    }

    async startImport(jobId: number, records: ImportRecordData[]) {
        // Fire and forget - processing happens in background
        this.processJob(jobId, records).catch(err => {
            console.error(`Fatal error processing job ${jobId}:`, err);
        });
    }

    private async processJob(jobId: number, records: ImportRecordData[]) {
        const job = await ImportJob.findByPk(jobId);
        if (!job) return;

        job.status = 'processing';
        job.total_records = records.length;
        await job.save();

        let processedSinceLastSave = 0;
        const BATCH_SIZE = 50;

        for (const recordData of records) {
            await this.processRecord(job, recordData);
            processedSinceLastSave++;

            if (processedSinceLastSave >= BATCH_SIZE) {
                await job.save();
                processedSinceLastSave = 0;
            }
        }

        // Final save to ensure all counts are accurate and status is completed
        job.status = 'completed';
        await job.save();
    }

    private async processRecord(job: ImportJob, recordData: ImportRecordData) {
        // 1. Check rate limit
        while (!rateLimiter.canProcess()) {
            const retryAfter = rateLimiter.getRetryAfter();
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }

        try {
            // 2. Validate data (basic check)
            if (!recordData.name || !recordData.email || !recordData.company) {
                throw new Error('Missing required fields');
            }

            // 3. Insert record
            await Record.create(recordData as any);

            // 4. Update stats (in memory only, saved in batch in processJob)
            job.processed_count += 1;
            job.success_count += 1;

        } catch (error: any) {
            job.processed_count += 1;
            job.failed_count += 1;

            let errorMessage = 'Unknown error';
            if (error instanceof ValidationError) {
                errorMessage = error.errors.map(e => e.message).join(', ');
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            // We still create errors immediately so they are safely stored
            await ImportError.create({
                job_id: job.id,
                record_data: JSON.stringify(recordData),
                error_message: errorMessage,
            });
        }
    }
}

export const importService = ImportService.getInstance();
