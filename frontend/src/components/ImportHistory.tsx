import React, { useState, useEffect } from 'react';
import { useImport } from '../context/Import/useImport';

interface ImportJob {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_records: number;
    processed_count: number;
    success_count: number;
    failed_count: number;
    created_at: string;
}

export const ImportHistory: React.FC = () => {

    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectJob, activeJob } = useImport();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/import');
                const data = await response.json();

                if (data.success) {
                    setJobs(data.data);
                } else {
                    setError('Failed to fetch import history');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
        // Poll every 5 seconds to update status
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);
    }, []);

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
                <h2 className="text-2xl font-bold mb-4">Import History</h2>

                {loading && <p className="text-gray-500">Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && jobs.length === 0 && (
                    <p className="text-gray-500">No import jobs found.</p>
                )}

                {!loading && !error && jobs.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Job ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Processed</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Success</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Failed</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {jobs.map((job) => (
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
                                                {job.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{job.total_records}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{job.processed_count}</td>
                                        <td className="px-4 py-3 text-sm text-green-600 font-medium">{job.success_count}</td>
                                        <td className="px-4 py-3 text-sm text-red-600 font-medium">{job.failed_count}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(job.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
