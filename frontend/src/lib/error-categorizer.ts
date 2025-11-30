import { ImportError, ErrorCategoryConfig } from '../types/import';
import { ERROR_PATTERNS } from '../constants';
import { XCircle, Copy } from 'lucide-react';

export type ErrorCategory = 'duplicates' | 'missing' | 'invalid' | 'unknown';

export interface ErrorCounts {
    duplicates: number;
    missing: number;
    invalid: number;
    unknown: number;
}

// Configuration for error category stat cards
const ERROR_CATEGORY_CONFIGS: Record<ErrorCategory, ErrorCategoryConfig> = {
    duplicates: {
        icon: Copy,
        className: 'text-purple-600',
        bgClassName: 'bg-purple-100',
        translationKey: 'dashboard.stats.duplicates',
    },
    missing: {
        icon: XCircle,
        className: 'text-amber-600',
        bgClassName: 'bg-amber-100',
        translationKey: 'dashboard.stats.missing',
    },
    invalid: {
        icon: XCircle,
        className: 'text-red-600',
        bgClassName: 'bg-red-100',
        translationKey: 'dashboard.stats.invalid',
    },
    unknown: {
        icon: XCircle,
        className: 'text-gray-600',
        bgClassName: 'bg-gray-100',
        translationKey: 'dashboard.stats.other',
    },
};

/**
 * Categorizes import errors by type
 */
export const categorizeErrors = (errors: ImportError[]): ErrorCounts => {
    return errors.reduce(
        (acc, error) => {
            const msg = error.error_message.toLowerCase();

            if (ERROR_PATTERNS.DUPLICATES.some((pattern) => msg.includes(pattern))) {
                acc.duplicates += 1;
            } else if (ERROR_PATTERNS.MISSING.some((pattern) => msg.includes(pattern))) {
                acc.missing += 1;
            } else if (ERROR_PATTERNS.INVALID.some((pattern) => msg.includes(pattern))) {
                acc.invalid += 1;
            } else {
                acc.unknown += 1;
            }
            return acc;
        },
        { duplicates: 0, missing: 0, invalid: 0, unknown: 0 } as ErrorCounts
    );
};

/**
 * Gets the configuration for a specific error category
 */
export const getErrorCategoryConfig = (category: ErrorCategory): ErrorCategoryConfig => {
    return ERROR_CATEGORY_CONFIGS[category];
};
