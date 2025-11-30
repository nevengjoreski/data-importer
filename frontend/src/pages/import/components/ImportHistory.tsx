import React, { useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useImport } from '../../../features/import/context/useImport';
import { useImportHistory } from '../../../features/import/queries/useImport.queries';
import { formatDuration } from '../../../lib/format-duration';
import { ImportJob } from '../../../types/import';

// --- Configuration & Constants ---

const STATUS_CONFIG: Record<string, string> = {
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    processing: 'text-blue-600 bg-blue-50',
    default: 'text-gray-600 bg-gray-50'
};

const TABLE_COLUMNS = [
    'id', 'status', 'total', 'processed', 'success',
    'failed', 'createdAt', 'completedAt', 'duration'
] as const;

// --- Helper Functions ---

const getStatusStyles = (status: string) =>
    STATUS_CONFIG[status] || STATUS_CONFIG.default;

const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleString() : '-';

const calculateDuration = (start: string, end?: string) => {
    if (!end) return null;
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
};

const scrollToDashboard = () => {
    const dashboard = document.getElementById('import-dashboard');
    dashboard?.scrollIntoView({ behavior: 'smooth' });
};

// --- Sub-Components ---

interface HistoryRowProps {
    job: ImportJob;
    isActive: boolean;
    onSelect: (id: number) => void;
}

const HistoryRow = memo(({ job, isActive, onSelect }: HistoryRowProps) => {
    const { t } = useTranslation();

    // Calculate derived data
    const duration = useMemo(() =>
        calculateDuration(job.created_at, job.completedAt),
        [job.created_at, job.completedAt]);

    const handleRowClick = useCallback(() => {
        onSelect(job.id);
        scrollToDashboard();
    }, [job.id, onSelect]);

    return (
        <tr
            onClick={handleRowClick}
            className={`
                hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0
                ${isActive ? 'bg-blue-50/60' : ''}
            `}
        >
            <td className="px-4 py-3 text-sm font-medium text-gray-900">#{job.id}</td>
            <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(job.status)}`}>
                    {t(`status.${job.status}`)}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-700">{job.total_records}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{job.processed_count}</td>
            <td className="px-4 py-3 text-sm text-green-600 font-medium">{job.success_count}</td>
            <td className="px-4 py-3 text-sm text-red-600 font-medium">{job.failed_count}</td>
            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(job.created_at)}</td>
            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(job.completedAt)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {duration !== null ? formatDuration(duration) : '-'}
            </td>
        </tr>
    );
});

HistoryRow.displayName = 'HistoryRow';

// --- Main Component ---

export const ImportHistory: React.FC = () => {
    const { t } = useTranslation();
    const { data: jobs, isLoading, error } = useImportHistory();
    const { selectJob, activeJob } = useImport();

    // Determine UI State
    if (isLoading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-500 animate-pulse">
                    {t('app.loading')}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
                    {t('errors.generic', { message: (error as Error).message })}
                </div>
            </div>
        );
    }

    const hasJobs = jobs && jobs.length > 0;

    return (
        <section className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <header className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">{t('history.title')}</h2>
                </header>

                {!hasJobs ? (
                    <div className="p-12 text-center text-gray-500 italic">
                        {t('history.noJobs')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {TABLE_COLUMNS.map((col) => (
                                        <th
                                            key={col}
                                            className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {t(`history.columns.${col}`)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jobs.map((job) => (
                                    <HistoryRow
                                        key={job.id}
                                        job={job}
                                        isActive={activeJob?.id === job.id}
                                        onSelect={selectJob}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};