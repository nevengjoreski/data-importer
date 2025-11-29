import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ImportJob } from '../../types/import';
import { XCircle, Copy } from 'lucide-react';

interface ImportStatsProps {
    job: ImportJob;
}

export const ImportStats: React.FC<ImportStatsProps> = ({ job }) => {
    // Categorize errors
    const errorCounts = (job.errors || []).reduce((acc, error) => {
        const msg = error.error_message.toLowerCase();

        if (msg.includes('unique') || msg.includes('duplicate')) {
            acc.duplicates = (acc.duplicates || 0) + 1;
        } else if (msg.includes('required') || msg.includes('missing') || msg.includes('empty') || msg.includes('null')) {
            acc.missing = (acc.missing || 0) + 1;
        } else if (msg.includes('invalid') || msg.includes('isemail')) {
            acc.invalid = (acc.invalid || 0) + 1;
        } else {
            acc.unknown = (acc.unknown || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const stats: any[] = [];

    // Add error cards dynamically
    if (errorCounts.duplicates) {
        stats.push({
            title: "Duplicates",
            value: errorCounts.duplicates,
            icon: Copy,
            className: "text-purple-600",
            bgClassName: "bg-purple-100"
        });
    }

    if (errorCounts.missing) {
        stats.push({
            title: "Missing Values",
            value: errorCounts.missing,
            icon: XCircle,
            className: "text-amber-600",
            bgClassName: "bg-amber-100"
        });
    }

    if (errorCounts.invalid) {
        stats.push({
            title: "Invalid Format",
            value: errorCounts.invalid,
            icon: XCircle,
            className: "text-red-600",
            bgClassName: "bg-red-100"
        });
    }

    if (errorCounts.unknown) {
        stats.push({
            title: "Other Errors",
            value: errorCounts.unknown,
            icon: XCircle,
            className: "text-gray-600",
            bgClassName: "bg-gray-100"
        });
    }

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
