import { createHandler } from '../getPresignedURLForDownload/index.js';
import FakeS3Service from './fakeS3Service.js';

describe('getPresignedURLForDownload', () => {
  let handler;
  let s3Service;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { 
      ...originalEnv, 
      S3_UPLOAD_BUCKET_NAME: 'test-bucket',
      S3_PRESIGNED_URL_EXPIRATION: '300'
    };
    s3Service = new FakeS3Service();
    handler = createHandler(s3Service);
  });

  afterEach(() => {
    process.env = originalEnv;
    s3Service.clearGeneratedUrls();
    s3Service.clearFiles();
  });

  it('returns 400 if fileName is missing', async () => {
    const res = await handler({ 
      body: JSON.stringify({}),
      requestContext: {
        authorizer: {
          lambda: {
            email: 'test@example.com'
          }
        }
      }
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('fileName is required');
  });

  it('returns 401 if email is not in token', async () => {
    const res = await handler({ 
      body: JSON.stringify({ fileName: 'test.txt' }),
      requestContext: {
        authorizer: {
          lambda: {}
        }
      }
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns presigned URL successfully if file exists', async () => {
    const email = 'test@example.com';
    const fileName = 'test.txt';
    const expectedKey = `${email}/${fileName}`;
    s3Service.putFile(email, expectedKey);

    const res = await handler({ 
      pathParameters: JSON.stringify({ fileName }),
      requestContext: {
        authorizer: {
          lambda: { email }
        }
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.presignedURL).toBeDefined();
    expect(body.presignedURL).toContain(expectedKey);
    expect(body.presignedURL).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
  });

  it('returns 404 if file does not exist', async () => {
    const email = 'test@example.com';
    const fileName = 'test.txt';

    const res = await handler({ 
      pathParameters: JSON.stringify({ fileName }),
      requestContext: {
        authorizer: {
          lambda: { email }
        }
      }
    });

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe('File not found');
  });
}); 