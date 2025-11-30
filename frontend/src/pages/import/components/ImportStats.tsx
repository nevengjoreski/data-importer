import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ImportJob } from '../../../types/import';
import { categorizeErrors, getErrorCategoryConfig, ErrorCategory } from '../../../lib/error-categorizer';

// --- Types ---

interface ImportStatsProps {
    job: ImportJob;
    selectedCategory: ErrorCategory | null;
    onSelectCategory: (category: ErrorCategory | null) => void;
}

// Internal interface to strictly type the mapped data
interface MappedStat {
    category: ErrorCategory;
    title: string;
    value: number;
    icon: LucideIcon;
    className: string;
    bgClassName: string;
}

// --- Sub-Components ---

interface StatItemProps {
    stat: MappedStat;
    isSelected: boolean;
    onClick: (category: ErrorCategory) => void;
}

const StatItem: React.FC<StatItemProps> = ({ stat, isSelected, onClick }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(stat.category);
        }
    };

    return (
        <Card
            className={`
                cursor-pointer transition-all duration-200 hover:shadow-md outline-none
                ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'}
            `}
            onClick={() => onClick(stat.category)}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-pressed={isSelected}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgClassName}`}>
                    <stat.icon className={`h-4 w-4 ${stat.className}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
        </Card>
    );
};

// --- Main Component ---

export const ImportStats: React.FC<ImportStatsProps> = ({ job, selectedCategory, onSelectCategory }) => {
    const { t } = useTranslation();

    // Memoize the calculation so we don't re-process errors on every render/click
    const stats = useMemo<MappedStat[]>(() => {
        const errorCounts = categorizeErrors(job.errors || []);
        const categories = Object.keys(errorCounts) as ErrorCategory[];

        return categories
            .filter((cat) => errorCounts[cat] > 0)
            .map((category) => {
                const config = getErrorCategoryConfig(category);
                return {
                    category,
                    title: t(config.translationKey),
                    value: errorCounts[category],
                    icon: config.icon,
                    className: config.className,
                    bgClassName: config.bgClassName,
                };
            });
    }, [job.errors, t]);

    const handleCategorySelect = (category: ErrorCategory) => {
        // Toggle: if clicking the already selected one, set to null
        onSelectCategory(selectedCategory === category ? null : category);
    };

    if (stats.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {stats.map((stat) => (
                <StatItem
                    key={stat.category}
                    stat={stat}
                    isSelected={selectedCategory === stat.category}
                    onClick={handleCategorySelect}
                />
            ))}
        </div>
    );
};