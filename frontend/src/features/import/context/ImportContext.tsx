import React, { createContext, ReactNode } from 'react';
import { ImportJob } from '../../../types/import';
import { useImportJobStatus, useStartImport, useStartBatchImport, useStartStreamImport, useClearRecords } from '../../import/queries/useImport.queries';
import { useNavigate, useParams } from 'react-router-dom';

export interface ImportContextValue {
    activeJob: ImportJob | null;
    isImporting: boolean;
    isClearing: boolean;
    error: string | null;
    startImport: () => Promise<void>;
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
    const activeJobId = id ? Number.parseInt(id, 10) : null;

    const { data: activeJob, error: jobError } = useImportJobStatus(activeJobId);
    const startImportMutation = useStartImport();
    const startBatchImportMutation = useStartBatchImport();
    const startStreamImportMutation = useStartStreamImport();
    const clearRecordsMutation = useClearRecords();

    const isImporting = (activeJob ? !['completed', 'failed'].includes(activeJob.status) : false) || startImportMutation.isPending || startBatchImportMutation.isPending || startStreamImportMutation.isPending;
    const isClearing = clearRecordsMutation.isPending;
    const error = (jobError as Error)?.message || (startImportMutation.error as Error)?.message || (startBatchImportMutation.error as Error)?.message || (startStreamImportMutation.error as Error)?.message || (clearRecordsMutation.error as Error)?.message || null;

    const startImport = React.useCallback(async () => {
        try {
            const data = await startImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startImportMutation, navigate]);

    const startBatchImport = React.useCallback(async () => {
        try {
            const data = await startBatchImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startBatchImportMutation, navigate]);

    const startStreamImport = React.useCallback(async () => {
        try {
            const data = await startStreamImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startStreamImportMutation, navigate]);

    const clearStatus = React.useCallback(() => {
        navigate('/');
        startImportMutation.reset();
        startBatchImportMutation.reset();
        startStreamImportMutation.reset();
        clearRecordsMutation.reset();
    }, [startImportMutation, startBatchImportMutation, startStreamImportMutation, clearRecordsMutation, navigate]);

    const clearRecords = React.useCallback(async () => {
        try {
            await clearRecordsMutation.mutateAsync();
            clearStatus();
        } catch (err) {
            console.error(err);
        }
    }, [clearRecordsMutation, clearStatus]);

    const selectJob = React.useCallback((jobId: number) => {
        navigate(`/import/${jobId}`);
    }, [navigate]);

    const value = React.useMemo(() => ({
        activeJob: activeJob || null,
        isImporting,
        isClearing,
        error: error || null,
        startImport,
        startBatchImport,
        startStreamImport,
        clearRecords,
        clearStatus,
        selectJob
    }), [activeJob, isImporting, isClearing, error, startImport, startBatchImport, startStreamImport, clearRecords, clearStatus, selectJob]);

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};


