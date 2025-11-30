import React, { createContext, ReactNode, useEffect } from 'react';
import { ImportJob } from '../../../types/import';
import { useImportJobStatus, useStartImport, useStartEnterpriseImport, useStartEnterpriseStreamImport, useClearRecords } from '../../import/queries/useImport.queries';
import { STORAGE_KEYS } from '../../../constants';

export interface ImportContextValue {
    activeJob: ImportJob | null;
    isImporting: boolean;
    isClearing: boolean;
    error: string | null;
    startImport: () => Promise<void>;
    startEnterpriseImport: () => Promise<void>;
    startEnterpriseStreamImport: () => Promise<void>;
    clearRecords: () => Promise<void>;
    clearStatus: () => void;
    selectJob: (jobId: number) => void;
}

export const ImportContext = createContext<ImportContextValue | undefined>(undefined);

export const ImportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeJobId, setActiveJobId] = React.useState<number | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID);
        return stored ? Number.parseInt(stored, 10) : null;
    });

    const { data: activeJob, error: jobError } = useImportJobStatus(activeJobId);
    const startImportMutation = useStartImport();
    const startEnterpriseImportMutation = useStartEnterpriseImport();
    const startEnterpriseStreamImportMutation = useStartEnterpriseStreamImport();
    const clearRecordsMutation = useClearRecords();

    const isImporting = (activeJob ? !['completed', 'failed'].includes(activeJob.status) : false) || startImportMutation.isPending || startEnterpriseImportMutation.isPending || startEnterpriseStreamImportMutation.isPending;
    const isClearing = clearRecordsMutation.isPending;
    const error = (jobError as Error)?.message || (startImportMutation.error as Error)?.message || (startEnterpriseImportMutation.error as Error)?.message || (startEnterpriseStreamImportMutation.error as Error)?.message || (clearRecordsMutation.error as Error)?.message || null;

    useEffect(() => {
        if (activeJob && ['completed', 'failed'].includes(activeJob.status)) {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID);
        }
    }, [activeJob]);

    const startImport = React.useCallback(async () => {
        try {
            const data = await startImportMutation.mutateAsync();
            setActiveJobId(data.jobId);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID, data.jobId.toString());
        } catch (err) {
            console.error(err);
        }
    }, [startImportMutation]);

    const startEnterpriseImport = React.useCallback(async () => {
        try {
            const data = await startEnterpriseImportMutation.mutateAsync();
            setActiveJobId(data.jobId);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID, data.jobId.toString());
        } catch (err) {
            console.error(err);
        }
    }, [startEnterpriseImportMutation]);

    const startEnterpriseStreamImport = React.useCallback(async () => {
        try {
            const data = await startEnterpriseStreamImportMutation.mutateAsync();
            setActiveJobId(data.jobId);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID, data.jobId.toString());
        } catch (err) {
            console.error(err);
        }
    }, [startEnterpriseStreamImportMutation]);

    const clearStatus = React.useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID);
        setActiveJobId(null);
        startImportMutation.reset();
        startEnterpriseImportMutation.reset();
        startEnterpriseStreamImportMutation.reset();
        clearRecordsMutation.reset();
    }, [startImportMutation, startEnterpriseImportMutation, startEnterpriseStreamImportMutation, clearRecordsMutation]);

    const clearRecords = React.useCallback(async () => {
        try {
            await clearRecordsMutation.mutateAsync();
            clearStatus();
        } catch (err) {
            console.error(err);
        }
    }, [clearRecordsMutation, clearStatus]);

    const selectJob = React.useCallback((jobId: number) => {
        setActiveJobId(jobId);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_IMPORT_JOB_ID, jobId.toString());
    }, []);

    const value = React.useMemo(() => ({
        activeJob: activeJob || null,
        isImporting,
        isClearing,
        error: error || null,
        startImport,
        startEnterpriseImport,
        startEnterpriseStreamImport,
        clearRecords,
        clearStatus,
        selectJob
    }), [activeJob, isImporting, isClearing, error, startImport, startEnterpriseImport, startEnterpriseStreamImport, clearRecords, clearStatus, selectJob]);

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};


