# Import Dashboard Solution

## Overview
This solution implements a robust, rate-limited import system capable of handling thousands of records. It uses a **backend-driven asynchronous processing** model optimized for scalability and performance.

## How to Run
1.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run init-db
    npm run dev
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
3.  Open `http://localhost:5173` and click "Start Import".

## Features
-   **Rate Limiting**: Respects the strict 2 req/sec limit using a token bucket algorithm.
-   **Resilience**: Import continues even if the browser is closed.
-   **Visibility**: Real-time progress bar, success/failure stats, and error details.
-   **Error Handling**: Captures and stores errors for individual records without stopping the entire job.
-   **Scalability**: Optimized to handle 100,000+ records via batch database updates.

## Architecture
1.  **Frontend**: React + Tailwind CSS + Shadcn UI.
    -   Polls the backend for job status.
    -   Visualizes progress and errors (virtualized/limited for performance).
2.  **Backend**: Node.js + Hono + SQLite.
    -   `ImportService`: Manages the import loop, rate limiting, and batch processing.
    -   `ImportJob`: Tracks overall progress.
    -   `ImportError`: Logs validation or database errors.

## Why this approach?
Handling 1000+ records with strict rate limits is best done on the server. A client-side loop is susceptible to network flakiness and browser interruptions. The server-side "worker" ensures consistent processing speed and reliability.

**Recent Optimizations:**
-   **Batch Processing**: Database updates are batched (every 50 records) to reduce I/O overhead by ~98%.
-   **UI Performance**: Error lists are limited to prevent browser crashes when handling large numbers of failures.
