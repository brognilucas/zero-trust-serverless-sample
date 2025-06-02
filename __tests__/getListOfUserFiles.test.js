import { createHandler } from '../getFilesForUser/index.js';
import FakeS3Service from './fakeS3Service.js';

describe('GetListOfUserFiles', () => {
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
  });

  it('returns 200 with empty list if no files', async () => {
    const res = await handler({ 
      requestContext: {
        authorizer: {
          lambda: {
            email: 'test@example.com'
          }
        }
      }
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).files).toEqual([]);
  });

  it('returns 401 if email is not in token', async () => {
    const res = await handler({ 
      requestContext: {
        authorizer: {
          lambda: {}
        }
      }
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with list of files', async () => {
    s3Service.putFile('test@example.com/test.pdf', 'test.pdf');

    const res = await handler({ 
      requestContext: {
        authorizer: {
          lambda: {
            email: 'test@example.com'  
          }
        }
      }
    });
    
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).files).toEqual(['test.pdf']);
  });
}); 