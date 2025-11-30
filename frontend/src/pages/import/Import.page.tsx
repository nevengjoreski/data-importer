import React, { useCallback, useState } from 'react';
import { ImportDashboard } from './components/ImportDashboard';
import { ImportHistory } from './components/ImportHistory';
import { BackendError } from '../../components/BackendError';
import { ImportProvider } from '../../features/import/context/ImportContext';
import { useHealthCheck } from '../../features/import/queries/useImport.queries';

// --- Sub-Components ---

const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            role="status"
            aria-label="Loading import system"
        />
    </div>
);

// --- Main Component ---

export function ImportPage() {
    // Assuming useHealthCheck wraps React Query. 
    // If it exports 'isRefetching', use that instead of local state.
    const { isError, isLoading, refetch } = useHealthCheck();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = useCallback(async () => {
        setIsRetrying(true);
        try {
            await refetch();
        } finally {
            // Ensure loading state is turned off even if refetch throws
            setIsRetrying(false);
        }
    }, [refetch]);

    if (isLoading) {
        return <PageLoader />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <BackendError
                    onRetry={handleRetry}
                    isRetrying={isRetrying}
                />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50/50 pb-12">
            <ImportProvider>
                <div className="space-y-8">
                    <ImportHistory />
                    <ImportDashboard />
                </div>
            </ImportProvider>
        </main>
    );
}