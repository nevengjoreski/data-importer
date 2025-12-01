import { ImportService } from '../../src/services/ImportService';
import ImportJob from '../../src/models/ImportJob';
import Record from '../../src/models/Record';
import ImportError from '../../src/models/ImportError';

import fs from 'fs';
import { Readable } from 'stream';

describe('ImportService', () => {
    let service: ImportService;

    beforeEach(() => {
        service = ImportService.getInstance();
        spyOn(ImportJob, 'findByPk').and.returnValue(Promise.resolve({
            id: 1,
            status: 'pending',
            processed_count: 0,
            success_count: 0,
            failed_count: 0,
            total_records: 0,
            save: jasmine.createSpy('save'),
            increment: jasmine.createSpy('increment'),
            reload: jasmine.createSpy('reload')

        } as any));

        spyOn(Record, 'findAll').and.returnValue(Promise.resolve([]));
        spyOn(Record, 'bulkCreate').and.returnValue(Promise.resolve([]));
        spyOn(Record, 'count').and.returnValue(Promise.resolve(10));
        spyOn(ImportError, 'create').and.returnValue(Promise.resolve({} as any));
        spyOn(ImportError, 'bulkCreate').and.returnValue(Promise.resolve([]));
    });

    describe('startImportBatch', () => {
        it('should process batch and start job processing', async () => {
            const records = [
                { name: 'Test', email: 'test@example.com', company: 'Test Co' }
            ];

            spyOn(service as any, 'processBatchAndInsert').and.returnValue(Promise.resolve());
            spyOn(service as any, 'processJob').and.returnValue(Promise.resolve());

            await service.startImportBatch(1, records);

            expect((service as any).processBatchAndInsert).toHaveBeenCalledWith(1, records);
            expect((service as any).processJob).toHaveBeenCalledWith(1);
        });

        it('should handle errors and mark job as failed', async () => {
            const records: any[] = [];
            spyOn(service as any, 'processBatchAndInsert').and.throwError('Test Error');

            await service.startImportBatch(1, records);

            expect(ImportJob.findByPk).toHaveBeenCalledWith(1);
        });
    });

    describe('startImportStream', () => {
        it('should process stream and update total records', async () => {
            const mockStream = new Readable({
                read() {
                    this.push('name,email,company\nTest,test@example.com,Test Co\n');
                    this.push(null);
                }
            });
            spyOn(fs, 'createReadStream').and.returnValue(mockStream as any);
            spyOn(service as any, 'processBatchAndInsert').and.returnValue(Promise.resolve());
            spyOn(service as any, 'processJob').and.returnValue(Promise.resolve());

            await service.startImportStream(1, 'test.csv');

            expect((service as any).processJob).toHaveBeenCalledWith(1);
        });
    });
});
