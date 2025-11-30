import { API_URL } from "../globals";

export const IMPORT_ENDPOINTS = {
    HEALTH: `${API_URL}/health`,
    IMPORT: `${API_URL}/api/import`,
    IMPORT_BATCH: `${API_URL}/api/import/batch`,
    IMPORT_STREAM: `${API_URL}/api/import/stream`,
    RECORDS: `${API_URL}/api/records`,
};
