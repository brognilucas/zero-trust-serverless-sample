import { createHandler } from '../auth/verify-mfa.js';
import FakeDatabase from './fakeDatabase.js';

describe('verify-mfa', () => {
  let handler;
  let database;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
    database = new FakeDatabase();
    handler = createHandler(database);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 if email is missing', async () => {
    const res = await handler({ 
      body: JSON.stringify({ code: '123456' })
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Email and code are required');
  });

  it('returns 400 if code is missing', async () => {
    const res = await handler({ 
      body: JSON.stringify({ email: 'test@example.com' })
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Email and code are required');
  });

  it('returns 401 if code is invalid', async () => {
    await database.setMfaCode('test@example.com', '123456');
    
    const res = await handler({ 
      body: JSON.stringify({ email: 'test@example.com', code: '654321' })
    });
    
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).message).toBe('Invalid code');
  });

  it('returns 401 if code is expired', async () => {
    const email = 'test@example.com';
    const mfaCode = '123456';
    
    // Manually set an expired code
    const expiredTtl = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    database.mfaCodes.set(email, { mfaCode, ttl: expiredTtl.toString() });
    
    const res = await handler({ 
      body: JSON.stringify({ email, code: mfaCode })
    });
    
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).message).toBe('Code expired');
  });

  it('returns 200 and JWT token for valid code', async () => {
    const email = 'test@example.com';
    const mfaCode = '123456';
    
    await database.setMfaCode(email, mfaCode);
    
    const res = await handler({ 
      body: JSON.stringify({ email, code: mfaCode })
    });
    
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    
    // Verify code was deleted
    expect(await database.getMfaCode(email)).toBeUndefined();
  });

  it('handles invalid JSON in request body', async () => {
    const res = await handler({ 
      body: 'invalid json'
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Internal server error');
  });
}); 