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
-   **Feedback Latency**: The UI relies on polling (or WebSockets - not implemented here and probably overkill for this use case) to get updates, rather than knowing immediately when a request finishes.

---

## Retry Logic with Exponential Backoff

### Context
External APIs (or simulated APIs) can fail temporarily due to rate limits (429) or server errors (5xx). Without retry logic, transient failures cause permanent record failures.

### Decision
Implemented **automatic retry mechanism** with exponential backoff for recoverable errors:
- **Max Retries**: 5 attempts per record
- **Retry Conditions**: HTTP 429 (Rate Limit Exceeded) and 5xx (Server Errors)
- **Backoff Strategy**: 
  - Respect `Retry-After` header if present
  - Otherwise use exponential backoff: 1s, 2s, 4s, 8s, 16s
- **Logging**: Console warnings for each retry attempt

### Rationale
-   **Resilience**: Transient API failures (network blips, temporary overload) shouldn't cause permanent data loss
-   **Smart Backoff**: Exponential delays prevent hammering a struggling API while still recovering quickly
-   **Standards Compliance**: Respecting `Retry-After` header follows HTTP best practices
-   **User Experience**: Higher success rates without manual re-imports

### Implementation
```typescript
const MAX_RETRIES = 5;
let attempt = 0;

while (attempt < MAX_RETRIES && !success) {
    try {
        attempt++;
        // Process record...
        success = true;
    } catch (error) {
        if ((is429 || is5xx) && attempt < MAX_RETRIES) {
            const waitTime = retryAfterHeader || (1000 * 2^(attempt-1));
            await sleep(waitTime);
            continue; // Retry
        }
        await failRecord(job, record, error.message);
        return; // Permanent failure
    }
}
```

### Trade-offs
-   **Processing Time**: Retries increase total import duration for jobs with many transient failures
-   **Complexity**: More code paths to test and maintain
-   **Resource Usage**: Failed retries consume API quota and server resources

### Future Improvements
-   Configurable retry limits per job type
-   Metrics tracking: retry success rate, average retries per record

---

## Refactored Error Handling

### Context
Error handling logic was duplicated across validation failures and API call failures.

### Decision
Extracted common error handling into a **`failRecord()` helper method**.

### Rationale
-   **DRY Principle**: Single place to update failure logic
-   **Consistency**: All failures follow the same process (update record status, increment counters, log error)
-   **Maintainability**: Easier to add features like error categorization or notifications

### Implementation
```typescript
private async failRecord(job: ImportJob, record: Record, message: string) {
    record.status = 'failed';
    record.response = { success: false, error: message, timestamp: ... };
    job.processed_count += 1;
    job.failed_count += 1;
    
    await ImportError.create({
        job_id: job.id,
        record_data: JSON.stringify({ name, email }),
        error_message: message
    });
}
```

---


## Two Import Strategies

### Context
Different use cases require different processing strategies. Process a large batch, or stream a massive file.

### Decision
Implemented **two distinct import modes**:
1.  **Batch Import**: Pre-load all records into DB, then process
2.  **Stream Import**: Process CSV file in streaming mode

### Rationale
-   **Batch Mode**: Optimal for known datasets where we can validate and deduplicate upfront before rate-limited processing
-   **Stream Mode**: Handles arbitrarily large files without loading everything into memory
-   **Flexibility**: Users can choose the appropriate strategy for their use case

### Implementation
- Separate endpoints: `/api/import/batch`, `/api/import/stream`
- Frontend button group with clear labels for each mode
- Each mode optimized for its specific use case

---

## Batch Processing Strategy

### Context
For batch imports, need to efficiently handle validation, deduplication, and rate-limited processing.

### Decision
Implemented a **two-phase batch processing** approach:
1.  **Phase 1: Bulk Insert** - Validate, deduplicate, and bulk insert all records as 'pending'
2.  **Phase 2: Rate-Limited Processing** - Process pending records respecting rate limits

### Rationale
-   **Fast Validation**: All validation errors (missing fields, invalid emails) are caught immediately
-   **Deduplication**: Duplicate emails are identified before any rate-limited API calls
-   **Progress Tracking**: `processed_count` includes both successful and failed records
-   **Efficiency**: Failed records don't consume rate limit quota

### Implementation Details
```typescript
// Phase 1: processBatchAndInsert()
- Normalize CSV data
- Validate required fields
- Check for duplicate emails
- Bulk create valid records as 'pending'
- Track failures (invalid/duplicate) in processed_count

// Phase 2: processJob()
- Fetch pending records in batches of 50
- Apply rate limiting (2 req/sec)
- Update record status to 'success' or 'failed'
- Batch DB updates every 50 records
```

---

## Stream Processing for Large Files

### Context
For massive CSV files (100k+ records), loading everything into memory is not feasible.

### Decision
Implemented **streaming CSV parsing** with incremental batch processing.

### Rationale
-   **Memory Efficient**: Processes file line-by-line
-   **Progressive Feedback**: UI shows progress as records are streamed
-   **Scalability**: Handles files of arbitrary size
-   **Unknown Total**: Total record count is calculated after streaming completes

### Implementation
```typescript
// Stream in batches of 500 records
for await (const row of csvStream) {
    batch.push(row);
    if (batch.length >= 500) {
        await processBatchAndInsert(jobId, batch);
        batch = [];
    }
}

// Calculate total after streaming
job.total_records = validRecords + failedRecords;
```

---

## Optimization: Batch Database Updates

### Context
Updating the `ImportJob` status after *every* single record creates massive write overhead.

### Decision
Implemented **Batch Updates** in `ImportService`. Job status is saved every 50 records (and at the end).

### Rationale
-   **Performance**: Reduces I/O operations by ~98%
-   **Scalability**: Essential for 10k-100k records
-   **UX**: Polling interval (1s) doesn't require sub-second precision

### Implementation
```typescript
const savePromises: Promise<any>[] = [];
for (const record of pendingRecords) {
    await processRecordLogic(job, record);
    savePromises.push(record.save());
}
await Promise.all(savePromises);  // Parallel DB writes
await job.save();  // Update once per batch
```

---

## URL-Based State Management

### Context
Traditional approach used `localStorage` for active job ID, but this has limitations (not shareable, no browser history).

### Decision
Migrated to **URL parameter-based routing** using `react-router-dom`.

### Rationale
-   **Shareability**: Users can share URLs to specific imports
-   **Browser History**: Back/forward buttons work correctly
-   **No Stale State**: Refreshing the page loads the correct job
-   **Modern Pattern**: Standard web application practice

### Implementation
```typescript
// Routes
<Route path="/" element={<ImportPage />} />
<Route path="/import/:id" element={<ImportPage />} />

// Context reads from URL params
const { id: jobId } = useParams();
```

---

## Progressive UI Enhancements

### Context
Users need clear visibility into import progress, especially for streaming imports where total is unknown.

### Decision
Implemented **adaptive progress visualization**:
1.  **Known Total**: Show percentage and green/red progress bar
2.  **Unknown Total (Streaming)**: Show "X records processed" and success/failure ratio

### Rationale
-   **Clarity**: Users understand what's happening regardless of import mode
-   **Visual Feedback**: Color-coded progress bar (green=success, red=failure)
-   **Real-time Updates**: Polling every 1 second for fresh data

### Implementation
```typescript
// Conditional rendering based on total_records
{job.total_records > 0 
    ? `${progressPercentage}%`
    : `${job.processed_count} records processed`
}

// Segmented progress bar
<div style={{ width: `${successPercentage}%` }} className="bg-green-500" />
<div style={{ width: `${failedPercentage}%` }} className="bg-red-500" />
```

---

## Interactive Error Filtering

### Context
Large imports can generate thousands of errors. Users need to quickly identify error patterns.

### Decision
Implemented **clickable error category cards** that filter the error list.

### Rationale
-   **Usability**: Users can drill down into specific error types
-   **Pattern Recognition**: Quickly identify if errors are duplicates, missing values, or invalid format
-   **Performance**: Limiting to 100 displayed errors prevents browser crashes

### Implementation
```typescript
// Error categorization
const categories = ['duplicates', 'missing', 'invalid', 'unknown'];

// Clickable stats cards
<Card onClick={() => onSelectCategory('duplicates')}>
  <CardTitle>Duplicates</CardTitle>
  <CardContent>{counts.duplicates}</CardContent>
</Card>

// Filtered error display
const filtered = selectedCategory 
    ? errors.filter(e => getErrorCategory(e) === selectedCategory)
    : errors;
```

---

## Controller-Based Architecture

### Context
Original routes file had all logic inline, making it hard to test and maintain.

### Decision
Extracted all route logic into **`ImportController` class** with static methods.

### Rationale
-   **Separation of Concerns**: Routes define API structure, controller handles business logic
-   **Testability**: Controller methods can be unit tested independently
-   **Maintainability**: Centralized import logic
-   **Scalability**: Easy to add new endpoints or modify existing ones

### Implementation
```typescript
// Clean route definitions
importRoutes.post('/batch', ImportController.startBatchImport);
importRoutes.post('/stream', ImportController.startStreamImport);

// Controller with business logic
export class ImportController {
    static async startBatchImport(c: Context) {
        // Validation, job creation, service invocation
    }
}
```

---

## Service Layer Pattern

### Context
Need to separate HTTP handling from core import logic.

### Decision
Created **`ImportService` singleton** that orchestrates all import processing.

### Rationale
-   **Single Responsibility**: Service focuses solely on import logic
-   **Reusability**: Can be used from controllers, CLI tools, or scheduled jobs
-   **Testability**: Easy to mock and test in isolation
-   **State Management**: Singleton ensures consistent rate limiter state

### Implementation
```typescript
export class ImportService {
    private static instance: ImportService;
    
    static getInstance(): ImportService {
        if (!ImportService.instance) {
            ImportService.instance = new ImportService();
        }
        return ImportService.instance;
    }
    
    async startImportBatch(jobId, records) { }
    async startImportStream(jobId, filePath) { }
}
```

---

## Duration Tracking

### Context
Users want to know how long imports took, especially for performance analysis.

### Decision
Added `completedAt` timestamp to `ImportJob` model and display duration in history.

### Rationale
-   **Performance Metrics**: Users can track import speed
-   **Debugging**: Helps identify bottlenecks
-   **UX**: Shows time investment for completed jobs

### Implementation
```typescript
// Model
completedAt: DataTypes.DATE

// Service
job.completedAt = new Date();
await job.save();

// UI - Human-readable format
const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${minutes}m ${seconds % 60}s`;
    return `${hours}h ${minutes}m`;
};
```

---

## Terminology Cleanup

### Context
Initial implementation used "Enterprise" terminology, which was unnecessarily specific.

### Decision
Renamed all "Enterprise" references to generic "Import" (batch/stream).

### Rationale
-   **Clarity**: "Batch" and "Stream" are more descriptive than "Enterprise"
-   **Simplicity**: Reduces cognitive load
-   **Consistency**: Aligns with industry-standard terminology

### Changes
- `EnterpriseImportService` → `ImportService`
- `/api/import-enterprise` → `/api/import/batch`
- `useStartEnterpriseImport` → `useStartBatchImport`

---

## Code Quality & Maintainability

### Context
Clean, maintainable code is essential for production systems.

### Decision
Performed comprehensive **code cleanup**:
1.  Removed all unnecessary comments
2.  Deleted unused components (`progress.tsx`)
3.  Consistent code formatting
4.  Self-documenting function names

### Rationale
-   **Readability**: Code should be self-explanatory
-   **Maintenance**: Less code = fewer bugs
-   **Performance**: Smaller bundle size

---

## Testing Strategy

### Context
Need confidence that the system works correctly, especially rate limiting and error handling.

### Decision
Implemented **Jasmine test suite** for backend with:
- Service layer tests
- Rate limiter tests
- Database transaction tests

### Rationale
-   **Reliability**: Critical paths are tested
-   **Regression Prevention**: Changes don't break existing functionality
-   **Documentation**: Tests serve as usage examples

### Future Work
- Frontend component tests (Vitest + React Testing Library)
- E2E tests for full import workflows

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

---

## Testing Strategy & Cleanup

### Context
To ensure long-term maintainability and reliability, the codebase needed a comprehensive test suite and a cleanup of development artifacts.

### Decision
1.  **Added Backend Controller Tests**: Implemented unit tests for `ImportController` to verify API contract and error handling.
2.  **Added Frontend Component Tests**: Implemented tests for `ImportPage` using Vitest and React Testing Library to verify UI states (loading, error, success).
3.  **Removed Comments**: Stripped all explanatory comments from the source code to enforce self-documenting code practices.

### Rationale
-   **Confidence**: Tests provide a safety net for future refactoring.
-   **Readability**: Removing comments forces code to be cleaner and variable names to be more descriptive.
-   **Standardization**: Frontend testing infrastructure (Vitest) aligns with modern React ecosystem standards.

