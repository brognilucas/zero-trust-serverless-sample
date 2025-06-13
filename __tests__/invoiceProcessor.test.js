import { createHandler } from '../invoiceProcessor/index.js';
import FakeS3Service from './fakeS3Service.js';
import { GeminiService } from '../services/geminiService.js';
import { jest } from '@jest/globals';

describe('InvoiceProcessor', () => {
  let handler;
  let s3Service;
  let llmService;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { 
      ...originalEnv, 
      S3_UPLOAD_BUCKET_NAME: 'test-bucket',
      S3_PRESIGNED_URL_EXPIRATION: '300',
      AWS_REGION: 'us-east-1',
      GEMINI_API_URL: 'https://api.gemini.test/',
      GEMINI_API_KEY: 'test-key'
    };
    s3Service = new FakeS3Service();
    llmService = new GeminiService();
    handler = createHandler(s3Service, llmService);
  });

  afterEach(() => {
    process.env = originalEnv;
    s3Service.clearFiles();
    jest.clearAllMocks();
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

  it('should abort if upload is not an invoice', async () => {
    const key = 'test@example.com/not-an-invoice.pdf';
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

    jest.spyOn(llmService, 'parseInvoice').mockRejectedValueOnce(new Error('Uploaded file is not an invoice'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to process invoice');
    expect(body.details).toContain('Uploaded file is not an invoice');
  });
}); 