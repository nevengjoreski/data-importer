import React, { createContext, ReactNode, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImportJob } from '../../../types/import';
import {
    useImportJobStatus,
    useStartBatchImport,
    useStartStreamImport,
    useClearRecords
} from '../../import/queries/useImport.queries';

// --- Constants ---
const NON_ACTIVE_STATUSES = ['completed', 'failed'] as const;

// --- Types ---
export interface ImportContextValue {
    activeJob: ImportJob | null;
    isImporting: boolean;
    isClearing: boolean;
    error: string | null;
    startBatchImport: () => Promise<void>;
    startStreamImport: () => Promise<void>;
    clearRecords: () => Promise<void>;
    clearStatus: () => void;
    selectJob: (jobId: number) => void;
}

export const ImportContext = createContext<ImportContextValue | undefined>(undefined);

export const ImportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Parse ID safely
    const activeJobId = useMemo(() => (id ? Number.parseInt(id, 10) : null), [id]);

    // --- Queries & Mutations ---
    const { data: activeJob, error: jobError } = useImportJobStatus(activeJobId);

    const batchMutation = useStartBatchImport();
    const streamMutation = useStartStreamImport();
    const clearMutation = useClearRecords();

    // --- Derived State (Memoized) ---

    const isImporting = useMemo(() => {
        const isJobActive = activeJob
            ? !NON_ACTIVE_STATUSES.includes(activeJob.status as any)
            : false;

        const isMutationPending = batchMutation.isPending || streamMutation.isPending;

        return isJobActive || isMutationPending;
    }, [activeJob, batchMutation.isPending, streamMutation.isPending]);

    const error = useMemo(() => {
        const errorSource =
            jobError ||
            batchMutation.error ||
            streamMutation.error ||
            clearMutation.error;

        return (errorSource as Error)?.message || null;
    }, [jobError, batchMutation.error, streamMutation.error, clearMutation.error]);

    const isClearing = clearMutation.isPending;

    // --- Actions ---

    // 1. Shared Helper to reduce code repetition
    const executeImportWrapper = useCallback(async (
        mutateFn: () => Promise<{ jobId: number }>
    ) => {
        try {
            const { jobId } = await mutateFn();
            navigate(`/import/${jobId}`);
        } catch (err) {
            console.error('Import initiation failed:', err);
            // Error is also captured by the `error` state above via mutation.error
        }
    }, [navigate]);

    // 2. Clear Status Action
    const clearStatus = useCallback(() => {
        navigate('/');
        batchMutation.reset();
        streamMutation.reset();
        clearMutation.reset();
    }, [navigate, batchMutation, streamMutation, clearMutation]);

    // 3. Public Methods
    const startBatchImport = useCallback(() => {
        return executeImportWrapper(() => batchMutation.mutateAsync());
    }, [executeImportWrapper, batchMutation]);

    const startStreamImport = useCallback(() => {
        return executeImportWrapper(() => streamMutation.mutateAsync());
    }, [executeImportWrapper, streamMutation]);

    const clearRecords = useCallback(async () => {
        try {
            await clearMutation.mutateAsync();
            clearStatus();
        } catch (err) {
            console.error('Clear records failed:', err);
        }
    }, [clearMutation, clearStatus]);

    const selectJob = useCallback((jobId: number) => {
        navigate(`/import/${jobId}`);
    }, [navigate]);

    // --- Context Value ---
    const value = useMemo<ImportContextValue>(() => ({
        activeJob: activeJob || null,
        isImporting,
        isClearing,
        error,
        startBatchImport,
        startStreamImport,
        clearRecords,
        clearStatus,
        selectJob
    }), [
        activeJob,
        isImporting,
        isClearing,
        error,
        startBatchImport,
        startStreamImport,
        clearRecords,
        clearStatus,
        selectJob
    ]);

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};