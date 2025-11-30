export interface ImportError {
    id: number;
    record_data: string;
    error_message: string;
    created_at: string;
}

export interface ImportJob {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_records: number;
    processed_count: number;
    success_count: number;
    failed_count: number;
    created_at: string;
    errors?: ImportError[];
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ImportJobResponse {
    success: boolean;
    jobId: number;
    message: string;
}

export interface HealthCheckResponse {
    status: string;
    timestamp: string;
}

export interface ClearRecordsResponse {
    success: boolean;
    message: string;
}

// Component Types
export interface StatCard {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    bgClassName: string;
}

export interface ErrorCategoryConfig {
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    bgClassName: string;
    translationKey: string;
}


