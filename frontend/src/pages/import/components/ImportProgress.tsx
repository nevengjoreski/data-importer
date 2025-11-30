import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { ImportJob } from '../../../types/import';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useImport } from '../../../features/import/context/useImport';

interface ImportProgressProps {
    job: ImportJob;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ job }) => {
    const { t } = useTranslation();
    const progressPercentage = Math.round((job.processed_count / job.total_records) * 100);
    const successPercentage = Math.round((job.success_count / job.total_records) * 100);
    const failedPercentage = Math.round((job.failed_count / job.total_records) * 100);

    const getStatusVariant = (status: ImportJob['status']): 'default' | 'destructive' | 'secondary' | 'outline' => {
        switch (status) {
            case 'completed': return 'default';
            case 'failed': return 'destructive';
            case 'processing': return 'secondary';
            default: return 'outline';
        }
    };


    return (
        <div className="space-y-4">

            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('dashboard.progress.overall')}</span>
                    <span>{job.total_records > 0 ? `${progressPercentage}%` : ''}</span>
                </div>

                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative">
                    {job.total_records > 0 ? (
                        <div className="h-full flex w-full">
                            <div
                                className="bg-green-500 transition-all duration-300"
                                style={{ width: `${successPercentage}%` }}
                            />
                            <div
                                className="bg-red-500 transition-all duration-300"
                                style={{ width: `${failedPercentage}%` }}
                            />
                        </div>
                    ) : (
                        <div className="h-full w-full bg-gray-100 overflow-hidden relative">
                            <div className="absolute inset-0 bg-blue-100 animate-pulse" />
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}

                    {job.total_records === 0 && job.processed_count > 0 && (
                        <div className="h-full flex w-full absolute inset-0">
                            <div
                                className="bg-green-500 transition-all duration-300"
                                style={{ width: `${(job.success_count / job.processed_count) * 100}%` }}
                            />
                            <div
                                className="bg-red-500 transition-all duration-300"
                                style={{ width: `${(job.failed_count / job.processed_count) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                <p className="text-xs text-muted-foreground text-right">
                    {job.total_records > 0
                        ? t('dashboard.progress.processed', { current: job.processed_count, total: job.total_records })
                        : `${job.processed_count} records processed`
                    }
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                        <p className="text-2xl font-bold text-green-700">{job.success_count}</p>
                        <p className="text-xs text-green-600">{t('dashboard.progress.successful')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                        <p className="text-2xl font-bold text-red-700">{job.failed_count}</p>
                        <p className="text-xs text-red-600">{t('dashboard.progress.failed')}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Badge variant={getStatusVariant(job.status)} className="uppercase">
                    {t(`status.${job.status}`)}
                </Badge>
            </div>
        </div>
    );
};
