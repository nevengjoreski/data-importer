import React, { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ImportJob } from '../../../types/import';
import { getErrorCategory, ErrorCategory, getErrorCategoryConfig } from '../../../lib/error-categorizer';

// --- Constants & Types ---

const MAX_VISIBLE_ERRORS = 100;
const RECORD_FIELDS: (keyof ParsedRecord)[] = ['name', 'email', 'company'];
const ERROR_CATEGORIES: ErrorCategory[] = ['duplicates', 'missing', 'invalid', 'unknown'];

interface ImportErrorsProps {
    errors?: ImportJob['errors'];
    selectedCategory: ErrorCategory | null;
    onSelectCategory: (category: ErrorCategory | null) => void;
}

interface ParsedRecord {
    name?: string;
    email?: string;
    company?: string;
}

// --- Helpers ---

const parseRecordData = (recordData: string): ParsedRecord => {
    try {
        return JSON.parse(recordData);
    } catch {
        return {};
    }
};

const getInvalidField = (errorMessage: string): keyof ParsedRecord | null => {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('email')) return 'email';
    if (msg.includes('name')) return 'name';
    if (msg.includes('company')) return 'company';
    return null;
};

// --- Sub-Components ---

interface RecordFieldProps {
    label: string;
    value?: string;
    isInvalid: boolean;
}

const RecordField: React.FC<RecordFieldProps> = ({ label, value, isInvalid }) => {
    if (value === undefined) return null;

    const labelClass = isInvalid ? 'text-red-600 font-semibold' : 'text-muted-foreground';
    const valueClass = isInvalid ? 'text-red-600 font-semibold' : 'text-foreground';

    return (
        <div className="flex items-center gap-2">
            <span className={`${labelClass} min-w-[60px]`}>{label}:</span>
            <span className={valueClass}>"{value}"</span>
        </div>
    );
};

interface FilterButtonProps {
    category: ErrorCategory;
    count: number;
    isSelected: boolean;
    onClick: (category: ErrorCategory) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ category, count, isSelected, onClick }) => {
    if (count === 0) return null;

    const config = getErrorCategoryConfig(category);
    const Icon = config.icon;

    const activeStyles = `${config.bgClassName} ${config.className} ring-2 ring-offset-1`;
    const inactiveStyles = 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50';

    return (
        <button
            onClick={() => onClick(category)}
            className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all hover:shadow-md
                ${isSelected ? activeStyles : inactiveStyles}
            `}
        >
            <Icon className={`h-3.5 w-3.5 ${config.className}`} />
            <span>{count}</span>
        </button>
    );
};

interface ErrorRowProps {
    err: NonNullable<ImportJob['errors']>[number];
    index: number;
}

const ErrorRow = memo(({ err, index }: ErrorRowProps) => {
    // Memoize heavy parsing operations if this list gets very long
    const record = useMemo(() => parseRecordData(err.record_data), [err.record_data]);
    const invalidField = useMemo(() => getInvalidField(err.error_message), [err.error_message]);

    const category = getErrorCategory(err);
    const categoryConfig = getErrorCategoryConfig(category);
    const CategoryIcon = categoryConfig.icon;

    return (
        <tr className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 align-middle font-medium w-12">{index + 1}</td>
            <td className="p-4 align-middle w-12">
                <div className={`p-1.5 rounded-full ${categoryConfig.bgClassName} inline-flex`}>
                    <CategoryIcon className={`h-3.5 w-3.5 ${categoryConfig.className}`} />
                </div>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col gap-1 font-mono text-xs">
                    {RECORD_FIELDS.map((field) => (
                        <RecordField
                            key={field}
                            label={field}
                            value={record[field]}
                            isInvalid={invalidField === field}
                        />
                    ))}
                </div>
            </td>
            <td className="p-4 align-middle">
                <span className="inline-flex items-center rounded-full border border-destructive/50 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    {err.error_message}
                </span>
            </td>
        </tr>
    );
});

ErrorRow.displayName = 'ErrorRow';

// --- Main Component ---

export const ImportErrors: React.FC<ImportErrorsProps> = ({ errors, selectedCategory, onSelectCategory }) => {
    const { t } = useTranslation();

    const filteredErrors = useMemo(() => {
        if (!errors) return [];
        if (!selectedCategory) return errors;
        return errors.filter(err => getErrorCategory(err) === selectedCategory);
    }, [errors, selectedCategory]);

    const categoryCounts = useMemo(() => {
        const initialCounts = { duplicates: 0, missing: 0, invalid: 0, unknown: 0 };
        if (!errors) return initialCounts;

        return errors.reduce((acc, err) => {
            const category = getErrorCategory(err);
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, initialCounts as Record<ErrorCategory, number>);
    }, [errors]);

    const handleCategoryClick = (category: ErrorCategory) => {
        onSelectCategory(selectedCategory === category ? null : category);
    };

    if (!filteredErrors || filteredErrors.length === 0) return null;

    const visibleErrors = filteredErrors.slice(0, MAX_VISIBLE_ERRORS);
    const hiddenCount = filteredErrors.length - MAX_VISIBLE_ERRORS;

    return (
        <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/10 pb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-destructive">
                            {t('dashboard.errors.title', { count: filteredErrors.length })}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {ERROR_CATEGORIES.map(category => (
                            <FilterButton
                                key={category}
                                category={category}
                                count={categoryCounts[category]}
                                isSelected={selectedCategory === category}
                                onClick={handleCategoryClick}
                            />
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white sticky top-0 z-10 border-b shadow-sm">
                            <tr>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"></th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Record Data</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Error Message</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {visibleErrors.map((err, index) => (
                                <ErrorRow key={err.id} err={err} index={index} />
                            ))}

                            {hiddenCount > 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-muted-foreground text-sm italic bg-muted/10">
                                        {t('dashboard.errors.more', { count: hiddenCount })}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};