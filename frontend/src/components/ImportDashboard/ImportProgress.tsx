import React from 'react';
import { Badge } from '../ui/badge';
import { ImportJob } from '../../types/import';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ImportProgressProps {
    job: ImportJob;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ job }) => {
    const progressPercentage = Math.round((job.processed_count / job.total_records) * 100);
    const successPercentage = Math.round((job.success_count / job.total_records) * 100);
    const failedPercentage = Math.round((job.failed_count / job.total_records) * 100);

    const getStatusVariant = (status: ImportJob['status']) => {
        switch (status) {
            case 'completed': return 'default';
            case 'failed': return 'destructive';
            case 'processing': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            {/* Progress Bar Section */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Overall Progress</span>
                    <span>{progressPercentage}%</span>
                </div>

                {/* Stacked Progress Bar */}
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full flex">
                        <div
                            className="bg-green-500 transition-all duration-300"
                            style={{ width: `${successPercentage}%` }}
                        />
                        <div
                            className="bg-red-500 transition-all duration-300"
                            style={{ width: `${failedPercentage}%` }}
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-right">
                    {job.processed_count} / {job.total_records} records processed
                </p>
            </div>

            {/* Success/Failure Visualization */}
            <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                        <p className="text-2xl font-bold text-green-700">{job.success_count}</p>
                        <p className="text-xs text-green-600">Successful</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                        <p className="text-2xl font-bold text-red-700">{job.failed_count}</p>
                        <p className="text-xs text-red-600">Failed</p>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-end pt-2">
                <Badge variant={getStatusVariant(job.status)} className="uppercase">
                    {job.status}
                </Badge>
            </div>
        </div>
    );
};
