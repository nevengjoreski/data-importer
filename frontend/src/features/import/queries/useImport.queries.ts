import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
    fetchHealth,
    fetchImportHistory,
    fetchImportJob,
    startImportJob,
    startBatchImportJob,
    startStreamImportJob,
    clearRecords,
} from '../api/import.api';
import { HealthCheckResponse, ImportJob, ImportJobResponse, ClearRecordsResponse } from '../../../types/import';
import { QUERY_KEYS, POLL_INTERVALS } from '../../../constants';

// Hooks
export const useHealthCheck = (): UseQueryResult<HealthCheckResponse, Error> => {
    return useQuery({
        queryKey: [QUERY_KEYS.HEALTH],
        queryFn: fetchHealth,
        retry: false,
        refetchOnWindowFocus: false,
    });
};

export const useImportHistory = (): UseQueryResult<ImportJob[], Error> => {
    return useQuery({
        queryKey: [QUERY_KEYS.IMPORT_HISTORY],
        queryFn: fetchImportHistory,
        refetchInterval: POLL_INTERVALS.IMPORT_HISTORY,
    });
};

export const useImportJobStatus = (jobId: number | null): UseQueryResult<ImportJob, Error> => {
    return useQuery({
        queryKey: [QUERY_KEYS.IMPORT_JOB, jobId],
        queryFn: () => fetchImportJob(jobId!),
        enabled: !!jobId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data && ['completed', 'failed'].includes(data.status)) {
                return false;
            }
            return POLL_INTERVALS.IMPORT_JOB;
        },
    });
};

export const useStartImport = (): UseMutationResult<ImportJobResponse, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: startImportJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.IMPORT_HISTORY] });
        },
    });
};

export const useStartBatchImport = (): UseMutationResult<ImportJobResponse, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: startBatchImportJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.IMPORT_HISTORY] });
        },
    });
};

export const useStartStreamImport = (): UseMutationResult<ImportJobResponse, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: startStreamImportJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.IMPORT_HISTORY] });
        },
    });
};

export const useClearRecords = (): UseMutationResult<ClearRecordsResponse, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: clearRecords,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.IMPORT_HISTORY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.IMPORT_JOB] });
        },
    });
};

