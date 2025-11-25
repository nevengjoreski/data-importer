import app from '../src/app';

describe('Rate Limiting', () => {
  it('should allow burst of 4 requests', async () => {
    const requests = [];
    
    for (let i = 0; i < 4; i++) {
      const req = new Request('http://localhost/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          company: 'Test Corp'
        })
      });
      requests.push(app.fetch(req));
    }

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });
  });

  it('should reject 5th request immediately', async () => {
    // Make 4 requests (burst limit)
    for (let i = 0; i < 4; i++) {
      const req = new Request('http://localhost/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Test User ${i}`,
          email: `limit${i}@example.com`,
          company: 'Test Corp'
        })
      });
      await app.fetch(req);
    }

    // 5th request should be rate limited
    const req = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: 'Test User 5',
        email: 'limit5@example.com',
        company: 'Test Corp'
      })
    });
    const response = await app.fetch(req);
    
    expect(response.status).toBe(429);
    const body: any = await response.json();
    expect(body.error).toBe('Rate limit exceeded');
    expect(body.retryAfter).toBeDefined();
  });

  it('should allow requests after token refill', async () => {
    // Make 4 requests (burst limit)
    for (let i = 0; i < 4; i++) {
      const req = new Request('http://localhost/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Test User ${i}`,
          email: `refill${i}@example.com`,
          company: 'Test Corp'
        })
      });
      await app.fetch(req);
    }

    // Wait for 0.5 seconds (should refill 1 token at 2 tokens/sec)
    await new Promise(resolve => setTimeout(resolve, 600));

    // This request should succeed after refill
    const req = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: 'Test User Refill',
        email: 'refill-after@example.com',
        company: 'Test Corp'
      })
    });
    const response = await app.fetch(req);
    
    expect(response.status).toBe(201);
  });
});
