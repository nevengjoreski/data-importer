import { Hono } from 'hono';
import { ImportController } from './controllers/ImportController';

const importRoutes = new Hono();

importRoutes.post('/', ImportController.startImport);
importRoutes.post('/test-data', ImportController.startTestDataImport);
importRoutes.post('/enterprise-batch', ImportController.startEnterpriseBatchImport);
importRoutes.post('/enterprise-stream', ImportController.startEnterpriseStreamImport);
importRoutes.get('/', ImportController.getHistory);
importRoutes.get('/:id', ImportController.getJobStatus);

export default importRoutes;
