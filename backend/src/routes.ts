import { Hono } from 'hono';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import Record from './models/Record';
import { rateLimiter } from './middleware/rateLimiter';

const routes = new Hono();

const validateRecordData = (name: unknown, email: unknown, company: unknown): string | null => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return 'name is required and must be a non-empty string';
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return 'email is required and must be a non-empty string';
  }

  if (!company || typeof company !== 'string' || company.trim() === '') {
    return 'company is required and must be a non-empty string';
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'email must be a valid email address';
  }

  return null;
};

routes.post('/records', async (c) => {
  // NOTE: Rate limiter simulates external API constraints (4 burst, 2/sec steady)
  if (!rateLimiter.canProcess()) {
    const retryAfter = rateLimiter.getRetryAfter();
    return c.json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter 
    }, 429);
  }

  try {
    const { name, email, company } = await c.req.json();

    const validationError = validateRecordData(name, email, company);
    if (validationError) {
      return c.json({ error: 'Validation failed', message: validationError }, 400);
    }

    const record = await Record.create({ 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      company: company.trim() 
    });

    return c.json({
      success: true,
      data: {
        id: record.id,
        name: record.name,
        email: record.email,
        company: record.company,
        created_at: record.created_at
      }
    }, 201);

  } catch (error) {
    console.error('Error creating record:', error);
    
    if (error instanceof UniqueConstraintError) {
      return c.json({ 
        error: 'Constraint violation',
        message: 'Record already exists' 
      }, 409);
    }
    
    if (error instanceof ValidationError) {
      return c.json({ 
        error: 'Validation failed',
        message: error.errors.map(e => e.message).join(', ')
      }, 400);
    }
    
    return c.json({ 
      error: 'Internal server error',
      message: 'Failed to create record. Please try again later.' 
    }, 500);
  }
});

export default routes;
