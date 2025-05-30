import { S3Service } from "../services/s3Service.js";

export const createHandler = (s3Service = new S3Service()) => {
  return async (event) => {
    try {
      const { fileName } = JSON.parse(event.body || '{}');
      if (!fileName) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'fileName is required' }),
        };
      }
      const email = event.requestContext.authorizer.lambda.email;
      if (!email) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'User email not found in token' }),
        };
      }

      const key = `${email}/${fileName}`;
      const presignedURL = await s3Service.getUploadPresignedUrl(key);
      return {
        statusCode: 200,
        body: JSON.stringify({ presignedURL }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate presigned URL', details: error.message }),
      };
    }
  };
}

export const handler = createHandler();