import { createHandler } from '../auth/signup.js';
import FakeDatabase from './fakeDatabase.js';

describe('signup', () => {
  let handler;
  let database;

  beforeEach(() => {
    database = new FakeDatabase();
    handler = createHandler(database);
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

  it('creates user successfully', async () => {
    const event = { 
      body: JSON.stringify({ email: 'user@example.com', password: '123456' })
    };
    
    const res = await handler(event);
    
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).message).toBe('User created successfully');
  });

  it('returns 409 if user already exists', async () => {
    const event = { 
      body: JSON.stringify({ email: 'exists@example.com', password: '123456' })
    };
   
    const firstSignup = await handler(event);
    expect(firstSignup.statusCode).toBe(201);
    
    const secondSignup = await handler(event);
    expect(secondSignup.statusCode).toBe(409);
    expect(JSON.parse(secondSignup.body).message).toBe('User already exists');
  });

  it('handles invalid JSON in request body', async () => {
    const res = await handler({ 
      body: 'invalid json'
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Internal server error');
  });
});
