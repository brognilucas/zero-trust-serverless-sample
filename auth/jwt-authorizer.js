import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    const token = event.headers.authorization.split(' ')[1];
    if (!token) {
      return {
        isAuthorized: false,
      };
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);    
    return {
      isAuthorized: true,
      context: {
        email: decoded.email
      }
    };
  } catch (error) { 
    console.error('JWT verification error:', error);
    return {
      isAuthorized: false,
    };
  }
};
