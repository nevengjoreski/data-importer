# Decision Log

## Architecture: Backend-Driven Import

### Context
The requirement was to import 1000 records via a rate-limited API (4 burst, 2/sec steady). The frontend needs to show progress.

### Decision
I chose a **Backend-Driven** approach where the frontend initiates the job, and the backend processes it asynchronously.

### Rationale
1.  **Reliability**: If the user closes the browser tab during a client-side import, the process stops. A backend worker continues regardless of client state.
2.  **Rate Limiting**: Managing precise rate limits (2 req/sec) is more reliable on the server where network latency between client and server doesn't interfere with the timing logic.
3.  **Scalability**: This pattern scales better. For 100,000 records, a client-side loop would be fragile. The backend can offload this to a proper queue (Redis/BullMQ) in the future.
4.  **Security**: Validation logic stays on the server.

### Trade-offs
-   **Complexity**: Requires setting up a job queue mechanism (simulated in-memory here) and polling from the frontend.
-   **Feedback Latency**: The UI relies on polling (or WebSockets) to get updates, rather than knowing immediately when a request finishes.

## Queue Strategy: In-Memory

### Context
Need to process records one by one or in batches while respecting rate limits.

### Decision
Used a simple in-memory "fire-and-forget" async function in `ImportService`.

### Rationale
-   **Simplicity**: For this assessment, setting up Redis/RabbitMQ is overkill and complicates the setup for the reviewer.
-   **Sufficiency**: It meets the requirement of not blocking the HTTP response and processing in the background.

### Future Improvements
-   Use a persistent queue (e.g., BullMQ) to handle server restarts.
-   Implement webhooks or WebSockets for real-time progress instead of polling.

## Optimization: Batch Database Updates

### Context
Updating the `ImportJob` status (processed/success/failed counts) in the database after *every* single record creates massive write overhead. For 100,000 records, this would mean 100,000+ DB transactions, which is slow and can lock the database (especially SQLite).

### Decision
Implemented **Batch Updates** in `ImportService`. The job status is saved to the database only every 50 records (and at the end).

### Rationale
-   **Performance**: Drastically reduces I/O operations.
-   **Scalability**: Essential for supporting larger datasets (10k-100k records).
-   **User Experience**: The UI polling interval (1s) is slow enough that "real-time" updates don't need to be perfectly instantaneous at the record level.

## UI Scalability: Limiting Error Display

### Context
If an import has a high failure rate (e.g., 50% duplicates in a 100k file), the frontend would try to render 50,000 error rows. This would crash the browser or make the UI unresponsive.

### Decision
Limited the `ImportErrors` component to display only the **first 100 errors**.

### Rationale
-   **Performance**: Prevents DOM overload and memory issues.
-   **Usability**: Users rarely review thousands of errors one by one in a web UI. They typically check the first few to identify patterns (e.g., "invalid email format") and then fix the source file.
-   **Alternative**: A full "Download Errors CSV" feature would be the production-grade solution for accessing all errors, but limiting the view is the correct immediate fix for UI stability.
