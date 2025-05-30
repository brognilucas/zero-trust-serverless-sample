import { createHandler } from '../auth/signin.js';
import FakeDatabase from './fakeDatabase.js';
import FakeEmailService from './fakeEmailService.js';
import bcrypt from 'bcrypt';

describe('signin', () => {
  let handler;
  let database;
  let emailService;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key' };
    database = new FakeDatabase();
    emailService = new FakeEmailService();
    handler = createHandler(database, emailService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 if email is missing', async () => {
    const res = await handler({ 
      body: JSON.stringify({ password: '123456' })
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Email and password required');
  });

  it('returns 400 if password is missing', async () => {
    const res = await handler({ 
      body: JSON.stringify({ email: 'test@example.com' })
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Email and password required');
  });

  it('returns 401 if user does not exist', async () => {
    const event = { 
      body: JSON.stringify({ email: 'notfound@example.com', password: '123456' })
    };
    
    const res = await handler(event);
    
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).message).toBe('Invalid credentials');
  });

  it('returns 401 if password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('correctpass', 10);
    database.users.set('user@example.com', { passwordHash });

    const event = { 
      body: JSON.stringify({ email: 'user@example.com', password: 'wrongpass' })
    };
    
    const res = await handler(event);
    
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).message).toBe('Invalid credentials');
  });

  it('sends MFA code on successful signin', async () => {
    const email = 'banana@example.com';
    const passwordHash = await bcrypt.hash('correctpass', 10);
    database.users.set(email, { passwordHash });
    
    const event = { 
      body: JSON.stringify({ email, password: 'correctpass' })
    };
    
    const res = await handler(event);
    
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toBe('MFA code sent');

    const sentEmails = emailService.getSentEmails();
    expect(sentEmails.length).toBe(1);
    expect(sentEmails[0].to).toContain(email);
    expect(sentEmails[0].subject).toBe('MFA CODE');
    
    const mfaRecord = await database.getMfaCode(email);
    expect(mfaRecord).toBeDefined();
    expect(mfaRecord.mfaCode).toBeDefined();
    expect(mfaRecord.ttl).toBeDefined();
  });

  it('handles invalid JSON in request body', async () => {
    const res = await handler({ 
      body: 'invalid json'
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Internal server error');
  });
});
