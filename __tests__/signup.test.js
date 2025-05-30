import { jest } from '@jest/globals';
import { handler as signup } from '../auth/signup.js';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('signup', () => {
  it('returns 400 if email or password missing', async () => {
    const res = await signup({ body: JSON.stringify({ email: 'a@b.com' }) });
    expect(res.statusCode).toBe(400);
  });

  it('creates user successfully', async () => {
    const event = { body: JSON.stringify({ email: 'user@example.com', password: '123456' }) };
    
    const res = await signup(event);
    
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).message).toBe('User created successfully');
  });

  it('returns 409 if user already exists', async () => {
    const event = { body: JSON.stringify({ email: 'exists@example.com', password: '123456' }) };
   
    await signup(event);
    const res = await signup(event);
   
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).message).toBe('User already exists');
  });
});
