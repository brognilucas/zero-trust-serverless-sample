import bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.js';

export const createHandler = (database = new DatabaseService()) => {
  return async (event) => {
    try {
      const { email, password } = JSON.parse(event.body);
      if (!email || !password) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Email and password required' }) };
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await database.createUser(email, passwordHash);
      return {
        statusCode: 201,
        body: JSON.stringify({ message: 'User created successfully' }),
      };
    } catch (err) {
      console.error(err);
      if (err.name === 'ConditionalCheckFailedException') {
        return { statusCode: 409, body: JSON.stringify({ message: 'User already exists' }) };
      }
      return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error', err }) };
    }
  };
};

export const handler = createHandler();

