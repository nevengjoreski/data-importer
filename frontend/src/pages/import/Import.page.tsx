import { useState } from 'react';
import { ImportDashboard } from './components/ImportDashboard';
import { ImportHistory } from './components/ImportHistory';
import { BackendError } from '../../components/BackendError';
import { ImportProvider } from '../../features/import/context/ImportContext';
import { useHealthCheck } from '../../features/import/queries/useImport.queries';

export function ImportPage() {
    const { isError, isLoading, refetch } = useHealthCheck();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        await refetch();
        setIsRetrying(false);
    };

    if (isError) {
        return <BackendError onRetry={handleRetry} isRetrying={isRetrying} />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ImportProvider>
            <ImportHistory />
            <ImportDashboard />
        </ImportProvider>
    );
}
