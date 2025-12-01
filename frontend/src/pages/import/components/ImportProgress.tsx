import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, LucideIcon } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { ImportJob } from '../../../types/import';

// --- Configuration & Types ---

const STATUS_VARIANTS: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    completed: 'default',
    failed: 'destructive',
    processing: 'secondary',
    default: 'outline',
};

interface ImportProgressProps {
    job: ImportJob;
}

// --- Helper Functions ---

/** Safely calculates percentage to avoid NaN/Infinity */
const calculatePercentage = (part: number, total: number): number => {
    if (total <= 0) return 0;
    return Math.min(Math.round((part / total) * 100), 100);
};

// --- Sub-Components ---

interface StatCardProps {
    icon: LucideIcon;
    count: number;
    label: string;
    variant: 'success' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, count, label, variant }) => {
    const styles = variant === 'success'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-red-50 border-red-200 text-red-700';

    const iconColor = variant === 'success' ? 'text-green-600' : 'text-red-600';

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${styles}`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
            <div>
                <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                <p className="text-xs opacity-90">{label}</p>
            </div>
        </div>
    );
};

interface ProgressBarProps {
    successPercent: number;
    failedPercent: number;
    isIndeterminate: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ successPercent, failedPercent, isIndeterminate }) => {
    if (isIndeterminate) {
        return (
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-100 animate-pulse" />
                <div className="h-full bg-blue-500 w-full opacity-20" />
            </div>
        );
    }

    return (
        <div
            className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative flex"
            role="progressbar"
            aria-valuenow={successPercent + failedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className="bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${successPercent}%` }}
                title={`${successPercent}% Successful`}
            />
            <div
                className="bg-red-500 transition-all duration-500 ease-out"
                style={{ width: `${failedPercent}%` }}
                title={`${failedPercent}% Failed`}
            />
        </div>
    );
};

// --- Main Component ---

export const ImportProgress: React.FC<ImportProgressProps> = ({ job }) => {
    const { t } = useTranslation();

    // Memoize stats to prevent recalculation on every render
    const stats = useMemo(() => {
        const hasTotal = job.total_records > 0;

        // If we have a fixed total, calculate based on that.
        // If streaming (total=0) but processing, calculate ratio based on processed count so bar isn't empty.
        const basis = hasTotal ? job.total_records : job.processed_count;

        return {
            overallProgress: calculatePercentage(job.processed_count, job.total_records),
            successPercent: calculatePercentage(job.success_count, basis),
            failedPercent: calculatePercentage(job.failed_count, basis),
            isIndeterminate: !hasTotal && job.processed_count === 0,
            hasTotal
        };
    }, [job.total_records, job.processed_count, job.success_count, job.failed_count]);

    const statusVariant = STATUS_VARIANTS[job.status] || STATUS_VARIANTS.default;

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>{t('dashboard.progress.overall')}</span>
                    <span>{stats.hasTotal ? `${stats.overallProgress}%` : ''}</span>
                </div>

                <ProgressBar
                    successPercent={stats.successPercent}
                    failedPercent={stats.failedPercent}
                    isIndeterminate={stats.isIndeterminate}
                />

                <p className="text-xs text-muted-foreground text-right tabular-nums">
                    {stats.hasTotal
                        ? t('dashboard.progress.processed', { current: job.processed_count, total: job.total_records })
                        : `${job.processed_count} records processed`
                    }
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
                <StatCard
                    icon={CheckCircle2}
                    count={job.success_count}
                    label={t('dashboard.progress.successful')}
                    variant="success"
                />
                <StatCard
                    icon={XCircle}
                    count={job.failed_count}
                    label={t('dashboard.progress.failed')}
                    variant="danger"
                />
            </div>

            {/* Status Footer */}
            <div className="flex justify-end pt-2">
                <Badge variant={statusVariant} className="uppercase tracking-wide font-semibold">
                    {t(`status.${job.status}`)}
                </Badge>
            </div>
        </div>
    );
};