import { API_URL } from "../globals";

export const IMPORT_ENDPOINTS = {
    HEALTH: `${API_URL}/health`,
    IMPORT: `${API_URL}/api/import`,
    IMPORT_TEST_DATA: `${API_URL}/api/import/test-data`,
    IMPORT_ENTERPRISE_BATCH: `${API_URL}/api/import/enterprise-batch`,
    IMPORT_ENTERPRISE_STREAM: `${API_URL}/api/import/enterprise-stream`,
    RECORDS: `${API_URL}/api/records`,
};
