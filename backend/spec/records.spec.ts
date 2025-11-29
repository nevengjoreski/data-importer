import app from '../src/app';
import Record from '../src/models/Record';
import { rateLimiter } from '../src/middleware/rateLimiter';

// Helper function to make requests
async function makeRequest(path: string, options: RequestInit) {
  const req = new Request(`http://localhost${path}`, options);
  return await app.fetch(req);
}

describe('POST /api/records', () => {
  beforeEach(async () => {
    rateLimiter.reset();
    await Record.destroy({ where: {} });
  });

  describe('when creating a record with valid data', () => {
    it('should create a record with name, email, and company', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp'
        })
      });

      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('John Doe');
      expect(body.data.email).toBe('john@example.com');
      expect(body.data.company).toBe('Tech Corp');
      expect(body.data.created_at).toBeDefined();
    });

    it('should save the record to the database', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Another Corp'
        })
      });

      expect(response.status).toBe(201);
      const body: any = await response.json();
      const savedRecord = await Record.findByPk(body.data.id);
      expect(savedRecord).not.toBeNull();
      expect(savedRecord?.name).toBe('Jane Smith');
      expect(savedRecord?.email).toBe('jane@example.com');
      expect(savedRecord?.company).toBe('Another Corp');
    });

    it('should increment record IDs correctly', async () => {
      const response1 = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'User One',
          email: 'user1@test.com',
          company: 'Company A'
        })
      });

      expect(response1.status).toBe(201);
      const body1: any = await response1.json();

      const response2 = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'User Two',
          email: 'user2@test.com',
          company: 'Company B'
        })
      });

      expect(response2.status).toBe(201);
      const body2: any = await response2.json();
      expect(body2.data.id).toBe(body1.data.id + 1);
    });

    it('should convert email to lowercase', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'Test@EXAMPLE.COM',
          company: 'Test Corp'
        })
      });

      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.data.email).toBe('test@example.com');
    });
  });

  describe('when validation fails', () => {
    it('should return 400 when name is missing', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          company: 'Test Corp'
        })
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.message).toContain('name');
    });

    it('should return 400 when email is missing', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          company: 'Test Corp'
        })
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.message).toContain('email');
    });

    it('should return 400 when company is missing', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com'
        })
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.message).toContain('company');
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          company: 'Test Corp'
        })
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.message).toContain('email');
    });

    it('should reject duplicate emails', async () => {
      await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'First User',
          email: 'duplicate@test.com',
          company: 'Company A'
        })
      });

      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Second User',
          email: 'duplicate@test.com',
          company: 'Company B'
        })
      });

      expect(response.status).toBe(409);
      const body: any = await response.json();
      expect(body.error).toBe('Constraint violation');
      expect(body.message).toContain('already exists');
    });
  });

  describe('response format', () => {
    it('should return correct response structure on success', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'format@test.com',
          company: 'Test Corp'
        })
      });

      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.success).toBeDefined();
      expect(body.data).toBeDefined();
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBeDefined();
      expect(body.data.email).toBeDefined();
      expect(body.data.company).toBeDefined();
      expect(body.data.created_at).toBeDefined();
    });

    it('should return correct error structure on failure', async () => {
      const response = await makeRequest('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBeDefined();
      expect(body.message).toBeDefined();
      expect(body.success).toBeUndefined();
    });
  });
});
