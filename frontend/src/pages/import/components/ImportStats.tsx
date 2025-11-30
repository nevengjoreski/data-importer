import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ImportJob, StatCard } from '../../../types/import';
import { categorizeErrors, getErrorCategoryConfig, ErrorCategory } from '../../../lib/error-categorizer';

interface ImportStatsProps {
    job: ImportJob;
}

export const ImportStats: React.FC<ImportStatsProps> = ({ job }) => {
    const { t } = useTranslation();

    const errorCounts = categorizeErrors(job.errors || []);

    // Build stat cards from non-zero error counts
    const stats: StatCard[] = (Object.keys(errorCounts) as ErrorCategory[])
        .filter((category) => errorCounts[category] > 0)
        .map((category) => {
            const config = getErrorCategoryConfig(category);
            return {
                title: t(config.translationKey),
                value: errorCounts[category],
                icon: config.icon,
                className: config.className,
                bgClassName: config.bgClassName,
            };
        });

    if (stats.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row flex-wrap justify-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stat.bgClassName} ml-2`}>
                            <stat.icon className={`h-4 w-4 ${stat.className}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

