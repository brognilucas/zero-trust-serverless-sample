import { createHandler } from '../invoiceProcessor/index.js';
import FakeS3Service from './fakeS3Service.js';

describe('InvoiceProcessor', () => {
  let handler;
  let s3Service;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { 
      ...originalEnv, 
      S3_UPLOAD_BUCKET_NAME: 'test-bucket',
      S3_PRESIGNED_URL_EXPIRATION: '300',
      AWS_REGION: 'us-east-1'
    };
    s3Service = new FakeS3Service();
    handler = createHandler(s3Service);
  });

  afterEach(() => {
    process.env = originalEnv;
    s3Service.clearFiles();
  });

  it('should process PDF invoice successfully', async () => {
    const key = 'test@example.com/invoice.pdf';
    s3Service.putPdfFile(key);
    
    const event = {
      Records: [{
        s3: {
          object: {
            key: key
          }
        }
      }]
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to process invoice');
  });

  it('should handle URL-encoded S3 object keys', async () => {
    const key = 'test@example.com/invoice.pdf';
    s3Service.putPdfFile(key);
    
    const event = {
      Records: [{
        s3: {
          object: {
            key: 'test%40example.com/invoice.pdf'
          }
        }
      }]
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to process invoice');
  });

  it('should handle non-PDF files', async () => {
    const key = 'test@example.com/invoice.txt';
    s3Service.putFile(key, new Uint8Array([0x54, 0x45, 0x58, 0x54]));
    
    const event = {
      Records: [{
        s3: {
          object: {
            key: key
          }
        }
      }]
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to process invoice');
    expect(body.details).toContain('File is not a PDF');
  });

  it('should handle missing files', async () => {
    const event = {
      Records: [{
        s3: {
          object: {
            key: 'test@example.com/nonexistent.pdf'
          }
        }
      }]
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to process invoice');
    expect(body.details).toContain('File not found');
  });
}); 