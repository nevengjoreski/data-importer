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
