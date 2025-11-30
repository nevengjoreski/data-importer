import React from 'react';
import { useTranslation } from 'react-i18next';
import { useImport } from '../../../features/import/context/useImport';
import { useImportHistory } from '../../../features/import/queries/useImport.queries';

export const ImportHistory: React.FC = () => {
    const { t } = useTranslation();
    const { data: jobs, isLoading: loading, error } = useImportHistory();
    const { selectJob, activeJob } = useImport();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'failed': return 'text-red-600 bg-red-50';
            case 'processing': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">{t('history.title')}</h2>

                {loading && <p className="text-gray-500">{t('app.loading')}</p>}
                {error && <p className="text-red-500">{(error).message}</p>}

                {!loading && !error && (!jobs || jobs.length === 0) && (
                    <p className="text-gray-500">{t('history.noJobs')}</p>
                )}

                {!loading && !error && jobs && jobs.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.id')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.status')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.total')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.processed')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.success')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.failed')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.createdAt')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.completedAt')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('history.columns.duration')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {jobs.map((job) => {
                                    const duration = job.completedAt
                                        ? Math.round((new Date(job.completedAt).getTime() - new Date(job.created_at).getTime()) / 1000)
                                        : null;

                                    return (
                                        <tr
                                            key={job.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${activeJob?.id === job.id ? 'bg-blue-50' : ''}`}
                                            onClick={() => {
                                                selectJob(job.id);
                                                const dashboard = document.getElementById('import-dashboard');
                                                if (dashboard) {
                                                    dashboard.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">#{job.id}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                    {t(`status.${job.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{job.total_records}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{job.processed_count}</td>
                                            <td className="px-4 py-3 text-sm text-green-600 font-medium">{job.success_count}</td>
                                            <td className="px-4 py-3 text-sm text-red-600 font-medium">{job.failed_count}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(job.created_at)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{job.completedAt ? formatDate(job.completedAt) : '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{duration !== null ? `${duration}s` : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
