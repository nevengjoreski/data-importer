export interface ImportRecordData {
    name: string;
    email: string;
    company: string;
}

export interface ImportJobResponse {
    success: boolean;
    jobId: number;
    message: string;
}

export interface ErrorResponse {
    error: string;
}
