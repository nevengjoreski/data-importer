// Application-wide constants

// Query Keys
export const QUERY_KEYS = {
    HEALTH: 'health',
    IMPORT_HISTORY: 'importHistory',
    IMPORT_JOB: 'importJob',
} as const;

// Poll Intervals (in milliseconds)
export const POLL_INTERVALS = {
    IMPORT_HISTORY: 5000,  // 5 seconds
    IMPORT_JOB: 1000,      // 1 second
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    ACTIVE_IMPORT_JOB_ID: 'activeImportJobId',
} as const;

// Error Categorization Patterns
export const ERROR_PATTERNS = {
    DUPLICATES: ['unique', 'duplicate'],
    MISSING: ['required', 'missing', 'empty', 'null'],
    INVALID: ['invalid', 'isemail'],
} as const;

// UI Constants
export const UI_CONSTANTS = {
    MAX_ERRORS_DISPLAY: 100,
} as const;
