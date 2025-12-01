import 'jasmine';
import { ImportController } from '../src/controllers/ImportController';
import ImportJob from '../src/models/ImportJob';
import { importService } from '../src/services/ImportService';
import fs from 'fs';

describe('ImportController', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        req = {
            param: (name: string) => req.params[name],
            params: {},
            json: () => Promise.resolve({})
        };
        res = {
            json: jasmine.createSpy('json'),
            status: jasmine.createSpy('status').and.returnValue(res)
        };
        next = jasmine.createSpy('next');
    });

    describe('startBatchImport', () => {
        it('should return 404 if test data file is not found', async () => {
            spyOn(fs, 'existsSync').and.returnValue(false);
            const context: any = { json: res.json };

            await ImportController.startBatchImport(context);

            expect(res.json).toHaveBeenCalledWith({ error: 'Test data file not found' }, 404);
        });

        it('should start batch import successfully', async () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(fs, 'readFileSync').and.returnValue('name,email,company\nTest,test@example.com,TestCorp');
            spyOn(ImportJob, 'create').and.returnValue(Promise.resolve({ id: 1, status: 'pending' } as any));
            spyOn(importService, 'startImportBatch');

            const context: any = { json: res.json };

            await ImportController.startBatchImport(context);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                jobId: 1,
                message: 'Batch import started'
            }, 202);
            expect(importService.startImportBatch).toHaveBeenCalled();
        });
    });

    describe('startStreamImport', () => {
        it('should return 404 if test data file is not found', async () => {
            spyOn(fs, 'existsSync').and.returnValue(false);
            const context: any = { json: res.json };

            await ImportController.startStreamImport(context);

            expect(res.json).toHaveBeenCalledWith({ error: 'Test data file not found' }, 404);
        });

        it('should start stream import successfully', async () => {
            spyOn(fs, 'existsSync').and.returnValue(true);
            spyOn(ImportJob, 'create').and.returnValue(Promise.resolve({ id: 1, status: 'pending' } as any));
            spyOn(importService, 'startImportStream');

            const context: any = { json: res.json };

            await ImportController.startStreamImport(context);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                jobId: 1,
                message: 'Stream import started'
            }, 202);
            expect(importService.startImportStream).toHaveBeenCalled();
        });
    });

    describe('getHistory', () => {
        it('should return list of jobs', async () => {
            const jobs = [{ id: 1, status: 'completed' }];
            spyOn(ImportJob, 'findAll').and.returnValue(Promise.resolve(jobs as any));

            const context: any = { json: res.json };

            await ImportController.getHistory(context);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: jobs });
        });
    });

    describe('getJobStatus', () => {
        it('should return job details if found', async () => {
            const job = { id: 1, status: 'completed' };
            spyOn(ImportJob, 'findByPk').and.returnValue(Promise.resolve(job as any));

            const context: any = { req: { param: () => 1 }, json: res.json };

            await ImportController.getJobStatus(context);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: job });
        });

        it('should return 404 if job not found', async () => {
            spyOn(ImportJob, 'findByPk').and.returnValue(Promise.resolve(null));

            const context: any = { req: { param: () => 999 }, json: res.json };

            await ImportController.getJobStatus(context);

            expect(res.json).toHaveBeenCalledWith({ error: 'Job not found' }, 404);
        });
    });
});
