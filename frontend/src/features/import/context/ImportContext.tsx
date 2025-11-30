import React, { createContext, ReactNode } from 'react';
import { ImportJob } from '../../../types/import';
import { useImportJobStatus, useStartImport, useStartEnterpriseImport, useStartEnterpriseStreamImport, useClearRecords } from '../../import/queries/useImport.queries';
import { useNavigate, useParams } from 'react-router-dom';

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
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const activeJobId = id ? Number.parseInt(id, 10) : null;

    const { data: activeJob, error: jobError } = useImportJobStatus(activeJobId);
    const startImportMutation = useStartImport();
    const startEnterpriseImportMutation = useStartEnterpriseImport();
    const startEnterpriseStreamImportMutation = useStartEnterpriseStreamImport();
    const clearRecordsMutation = useClearRecords();

    const isImporting = (activeJob ? !['completed', 'failed'].includes(activeJob.status) : false) || startImportMutation.isPending || startEnterpriseImportMutation.isPending || startEnterpriseStreamImportMutation.isPending;
    const isClearing = clearRecordsMutation.isPending;
    const error = (jobError as Error)?.message || (startImportMutation.error as Error)?.message || (startEnterpriseImportMutation.error as Error)?.message || (startEnterpriseStreamImportMutation.error as Error)?.message || (clearRecordsMutation.error as Error)?.message || null;

    const startImport = React.useCallback(async () => {
        try {
            const data = await startImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startImportMutation, navigate]);

    const startEnterpriseImport = React.useCallback(async () => {
        try {
            const data = await startEnterpriseImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startEnterpriseImportMutation, navigate]);

    const startEnterpriseStreamImport = React.useCallback(async () => {
        try {
            const data = await startEnterpriseStreamImportMutation.mutateAsync();
            navigate(`/import/${data.jobId}`);
        } catch (err) {
            console.error(err);
        }
    }, [startEnterpriseStreamImportMutation, navigate]);

    const clearStatus = React.useCallback(() => {
        navigate('/');
        startImportMutation.reset();
        startEnterpriseImportMutation.reset();
        startEnterpriseStreamImportMutation.reset();
        clearRecordsMutation.reset();
    }, [startImportMutation, startEnterpriseImportMutation, startEnterpriseStreamImportMutation, clearRecordsMutation, navigate]);

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


