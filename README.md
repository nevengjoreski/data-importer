# Import Dashboard - Take-Home Assessment

## Overview

This is a starter repository for a take-home assessment focused on building a resilient import workflow system.

## What's Included

- **Backend (Working Example)**: Complete REST API with rate limiting, validation, and error handling
- **Database**: SQLite with Sequelize ORM, pre-configured schema for tracking records
- **Backend Tests**: Jasmine test suite covering API endpoints and rate limiting behavior
- **Frontend (Starter)**: React + Vite app with empty dashboard structure
- **Test Data Utility**: Helper function for generating mock data


## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run init-db  # Initialize the SQLite database
npm run dev
```

The backend will be running on `http://localhost:4000`

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be running on `http://localhost:5173`

### 3. Run Tests (Optional)

```bash
cd backend
npm test
```

### 4. Verification

After setup, verify everything is working:

1. ✅ Backend running on port 4000
2. ✅ Frontend running on port 5173
3. ✅ Database file created at `backend/data/database.db`
4. ✅ No errors in either terminal
5. ✅ Backend tests pass: `cd backend && npm test`
6. ✅ Test the API: `curl -X POST http://localhost:4000/api/records -H "Content-Type: application/json" -d '{"name": "John Doe", "email": "john@example.com", "company": "Test Corp"}'`

You're now ready to start building your solution!

## Database Schema

The SQLite database is pre-configured with a `records` table:

- **records**: Stores imported records with the following fields:
  - `id` (integer, primary key, auto-increment)
  - `name` (string, required)
  - `email` (string, required, unique, validated)
  - `company` (string, required)
  - `created_at` (timestamp)

The database is initialized with `npm run init-db`. See `backend/src/initDb.ts` for the complete schema.

### Testing the Backend API

The backend provides a working endpoint for creating records:

```bash
# Create a new record
curl -X POST http://localhost:4000/api/records \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "company": "Tech Corp"}'
```

This endpoint includes rate limiting, validation, and error handling. You can use it as-is or extend it with additional endpoints/functionality as needed for your solution.

## The Challenge

Build a production-ready system that imports 1000 records through a rate-limited API.

### Backend API (Provided)

A working backend is included with the following characteristics:

**Endpoint:** `POST /api/records`
- **Request:** `{ name: string, email: string, company: string }`
  - `name`: Required, non-empty string
  - `email`: Required, valid email format, must be unique
  - `company`: Required, non-empty string
- **Success Response (201):** `{ success: true, data: { id, name, email, company, created_at } }`
- **Rate Limit Response (429):** `{ error: "Rate limit exceeded", message: "...", retryAfter: number }`
- **Validation Error (400):** `{ error: "Validation failed", message: "..." }`
- **Duplicate Email (409):** `{ error: "Constraint violation", message: "Record already exists" }`

**Rate Limiting (Simulated External API):**
- Burst capacity: 4 requests/second
- Steady rate: 2 requests/second
- **CRITICAL:** The rate limiter in `backend/src/middleware/rateLimiter.ts` must NOT be modified. These values simulate external API constraints that you cannot control.

You may extend the backend with additional routes, batch endpoints, or other features as needed.

### Test Data

A sample CSV file with 1000 records is provided at `frontend/src/import-data/test-data-1000.csv` with the following structure:
```csv
name,email,company
"John Doe","john@example.com","Tech Corp"
...
```

**Note:** The test data contains some invalid records (empty fields, invalid emails, duplicate emails) that will need to be handled or filtered during import. You can use this data as-is or convert it to JSON if you prefer. There's no need to implement file upload functionality—focus on processing and importing the provided dataset.

### Requirements

**Core Requirements:**
- Successfully import all valid records from the 1000-record dataset
- Handle rate limiting and failures gracefully
- Handle invalid data (missing fields, invalid emails, duplicates) appropriately
- Provide visibility into the import process (success/failure/skipped counts)
- Modern UI and dashboard with good user experience
- Include tests for your implementation

**Things to Consider:**
- How will you handle the rate limits efficiently?
- What happens when requests fail?
- How will users understand what's happening?
- How would your solution scale to 100,000 records?
- What tradeoffs are you making between speed, reliability, and complexity?

You can implement this entirely in the frontend, extend the backend, or both—whatever you believe is the right approach.

## Candidate Autonomy

> You are free to structure the frontend, extend the backend, and design the overall architecture in any way you believe is appropriate for a production-grade system.

Feel free to:
- **Frontend:** Structure React components, choose state management, add UI libraries
- **Backend:** Add new routes, implement batch endpoints, modify database schema, add job queuing
- **Architecture:** Design the solution as frontend-heavy, backend-heavy, or balanced
- Add any additional libraries or tools you find necessary
- Implement additional features that improve the user experience
- Organize your code in a way that demonstrates best practices

**The only constraint:** Do not modify the rate limiter in `backend/src/middleware/rateLimiter.ts`

We're interested in seeing how you approach building a robust, maintainable system that handles real-world API constraints.
