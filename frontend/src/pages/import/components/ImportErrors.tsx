import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

import { ImportJob } from '../../../types/import';
import { AlertCircle } from 'lucide-react';

import { getErrorCategory, ErrorCategory, getErrorCategoryConfig } from '../../../lib/error-categorizer';

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

const parseRecordData = (recordData: string): ParsedRecord => {
    try {
        return JSON.parse(recordData);
    } catch {
        return {};
    }
};

const getInvalidField = (errorMessage: string): string | null => {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('email')) return 'email';
    if (msg.includes('name')) return 'name';
    if (msg.includes('company')) return 'company';
    return null;
};

export const ImportErrors: React.FC<ImportErrorsProps> = ({ errors, selectedCategory, onSelectCategory }) => {
    const { t } = useTranslation();

    const filteredErrors = React.useMemo(() => {
        if (!errors) return [];
        if (!selectedCategory) return errors;
        return errors.filter(err => getErrorCategory(err) === selectedCategory);
    }, [errors, selectedCategory]);

    const categoryCounts = React.useMemo(() => {
        if (!errors) return { duplicates: 0, missing: 0, invalid: 0, unknown: 0 };

        return errors.reduce((acc, err) => {
            const category = getErrorCategory(err);
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, { duplicates: 0, missing: 0, invalid: 0, unknown: 0 } as Record<ErrorCategory, number>);
    }, [errors]);

    const categories: ErrorCategory[] = ['duplicates', 'missing', 'invalid', 'unknown'];

    if (!filteredErrors || filteredErrors.length === 0) return null;

    return (
        <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/10 pb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-destructive">{t('dashboard.errors.title', { count: filteredErrors.length })}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {categories.map(category => {
                            const count = categoryCounts[category];
                            if (count === 0) return null;

                            const config = getErrorCategoryConfig(category);
                            const Icon = config.icon;
                            const isActive = selectedCategory === category;

                            return (
                                <button
                                    key={category}
                                    onClick={() => onSelectCategory(isActive ? null : category)}
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                        transition-all hover:shadow-md
                                        ${isActive
                                            ? `${config.bgClassName} ${config.className} ring-2 ring-offset-1`
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <Icon className={`h-3.5 w-3.5 ${isActive ? config.className : 'text-gray-400'}`} />
                                    <span>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">#</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12"></th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Record Data</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Error Message</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredErrors.slice(0, 100).map((err, index) => {
                                const record = parseRecordData(err.record_data);
                                const invalidField = getInvalidField(err.error_message);
                                const category = getErrorCategory(err);
                                const categoryConfig = getErrorCategoryConfig(category);
                                const CategoryIcon = categoryConfig.icon;

                                return (
                                    <tr key={err.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className={`p-1.5 rounded-full ${categoryConfig.bgClassName} inline-flex`}>
                                                <CategoryIcon className={`h-3.5 w-3.5 ${categoryConfig.className}`} />
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col gap-1 font-mono text-xs">
                                                {record.name !== undefined && (
                                                    <div className="flex items-center gap-2">
                                                        <span className={invalidField === 'name' ? 'text-red-600 font-semibold min-w-[60px]' : 'text-muted-foreground min-w-[60px]'}>name:</span>
                                                        <span className={invalidField === 'name' ? 'text-red-600 font-semibold' : 'text-foreground'}>
                                                            "{record.name || ''}"
                                                        </span>
                                                    </div>
                                                )}
                                                {record.email !== undefined && (
                                                    <div className="flex items-center gap-2">
                                                        <span className={invalidField === 'email' ? 'text-red-600 font-semibold min-w-[60px]' : 'text-muted-foreground min-w-[60px]'}>email:</span>
                                                        <span className={invalidField === 'email' ? 'text-red-600 font-semibold' : 'text-foreground'}>
                                                            "{record.email || ''}"
                                                        </span>
                                                    </div>
                                                )}
                                                {record.company !== undefined && (
                                                    <div className="flex items-center gap-2">
                                                        <span className={invalidField === 'company' ? 'text-red-600 font-semibold min-w-[60px]' : 'text-muted-foreground min-w-[60px]'}>company:</span>
                                                        <span className={invalidField === 'company' ? 'text-red-600 font-semibold' : 'text-foreground'}>
                                                            "{record.company || ''}"
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-full border border-destructive/50 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                                                {err.error_message}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredErrors.length > 100 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-muted-foreground text-sm italic">
                                        {t('dashboard.errors.more', { count: filteredErrors.length - 100 })}
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
