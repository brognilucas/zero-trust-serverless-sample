import jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.js';

export const createHandler = (database = new DatabaseService()) => {
  return async (event) => {
    try {
      const { email, code } = JSON.parse(event.body || '{}');

      if (!email || !code) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Email and code are required' }),
        };
      }

      const record = await database.getMfaCode(email);

      if (!record || record.mfaCode !== code) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Invalid code' }),
        };
      }

      const now = Math.floor(Date.now() / 1000);
      if (now > parseInt(record.ttl, 10)) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: 'Code expired' }),
        };
      }

      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      await database.deleteMfaCode(email);

      return {
        statusCode: 200,
        body: JSON.stringify({ token }),
      };
    } catch (err) {
      console.error('Error verifying MFA code', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error' }),
      };
    }
  };
};

export const handler = createHandler();
