import { Hono } from 'hono';
import { ImportController } from './controllers/ImportController';

const importRoutes = new Hono();

importRoutes.post('/batch', ImportController.startBatchImport);
importRoutes.post('/stream', ImportController.startStreamImport);
importRoutes.get('/', ImportController.getHistory);
importRoutes.get('/:id', ImportController.getJobStatus);

export default importRoutes;
