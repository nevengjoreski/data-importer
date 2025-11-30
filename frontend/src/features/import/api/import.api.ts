import { API_ENDPOINTS } from '../../../config/api';
import { ImportJob, HealthCheckResponse, ImportJobResponse, ClearRecordsResponse } from '../../../types/import';

export const fetchHealth = async (): Promise<HealthCheckResponse> => {
    const response = await fetch(API_ENDPOINTS.HEALTH);
    if (!response.ok) {
        throw new Error('Backend unavailable');
    }
    return response.json();
};

export const fetchImportHistory = async (): Promise<ImportJob[]> => {
    const response = await fetch(API_ENDPOINTS.IMPORT);
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch import history');
    }
    return data.data as ImportJob[];
};

export const fetchImportJob = async (jobId: number): Promise<ImportJob> => {
    const response = await fetch(`${API_ENDPOINTS.IMPORT}/${jobId}`);
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch job status');
    }
    return data.data as ImportJob;
};

export const startImportJob = async (): Promise<ImportJobResponse> => {
    const response = await fetch(API_ENDPOINTS.IMPORT_TEST_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error('Failed to start import');
    }
    const data = await response.json();
    return data;
};

export const startEnterpriseImportJob = async (): Promise<ImportJobResponse> => {
    const response = await fetch(API_ENDPOINTS.IMPORT_ENTERPRISE_BATCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error('Failed to start enterprise import');
    }
    const data = await response.json();
    return data;
};

export const startEnterpriseStreamImportJob = async (): Promise<ImportJobResponse> => {
    const response = await fetch(API_ENDPOINTS.IMPORT_ENTERPRISE_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error('Failed to start enterprise stream import');
    }
    const data = await response.json();
    return data;
};

export const clearRecords = async (): Promise<ClearRecordsResponse> => {
    const response = await fetch(API_ENDPOINTS.RECORDS, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to clear records');
    }
    return response.json();
};
