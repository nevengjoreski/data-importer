import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ImportJob } from '../../types/import';

interface ImportContextValue {
    activeJob: ImportJob | null;
    isImporting: boolean;
    error: string | null;
    startImport: () => Promise<void>;
    clearRecords: () => Promise<void>;
    clearStatus: () => void;
    selectJob: (jobId: number) => void;
}

export const ImportContext = createContext<ImportContextValue | undefined>(undefined);

export const ImportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollingIntervalRef = React.useRef<number | null>(null);

    const pollJobStatus = React.useCallback(async (jobId: number) => {
        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const fetchStatus = async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/import/${jobId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    setActiveJob(data.data);

                    if (['completed', 'failed'].includes(data.data.status)) {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setIsImporting(false);
                        localStorage.removeItem('activeImportJobId');
                    } else {
                        setIsImporting(true);
                    }
                }
            } catch (err) {
                console.error('Error polling status:', err);
                // Don't clear interval on fetch errors, keep trying
            }
        };

        // Fetch immediately
        fetchStatus();

        // Then poll
        const interval = setInterval(fetchStatus, 1000);
        pollingIntervalRef.current = interval;
    }, []);

    // On mount, check localStorage for active job ID and resume polling
    useEffect(() => {
        const storedJobId = localStorage.getItem('activeImportJobId');
        if (storedJobId) {
            const jobId = parseInt(storedJobId, 10);
            pollJobStatus(jobId);
        }

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [pollJobStatus]);

    const startImport = React.useCallback(async () => {
        try {
            setIsImporting(true);
            setError(null);
            const response = await fetch('http://localhost:4000/api/import/test-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to start import');
            }

            const data = await response.json();
            localStorage.setItem('activeImportJobId', data.jobId.toString());
            pollJobStatus(data.jobId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setIsImporting(false);
        }
    }, [pollJobStatus]);

    const clearStatus = React.useCallback(() => {
        // Clear the polling interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        localStorage.removeItem('activeImportJobId');
        setActiveJob(null);
        setIsImporting(false);
        setError(null);
    }, []);

    const clearRecords = React.useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('http://localhost:4000/api/records', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to clear records');
            }

            clearStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear records');
        }
    }, [clearStatus]);

    const selectJob = React.useCallback((jobId: number) => {
        localStorage.setItem('activeImportJobId', jobId.toString());
        pollJobStatus(jobId);
    }, [pollJobStatus]);

    const value = React.useMemo(() => ({
        activeJob,
        isImporting,
        error,
        startImport,
        clearRecords,
        clearStatus,
        selectJob
    }), [activeJob, isImporting, error, startImport, clearRecords, clearStatus, selectJob]);

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};


