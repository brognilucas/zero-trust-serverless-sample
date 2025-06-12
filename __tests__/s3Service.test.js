import { S3Service } from '../services/s3Service.js';
import FakeS3Service from './fakeS3Service.js';

describe('S3Service', () => {
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
  });

  afterEach(() => {
    process.env = originalEnv;
    s3Service.clearFiles();
    s3Service.clearGeneratedUrls();
  });

  describe('extractTextFromPdf', () => {
    it('should throw error if file is not a PDF', async () => {
      const key = 'test.txt';
      const buffer = Buffer.from('This is not a PDF file');
      s3Service.putFile(key, buffer);
      
      await expect(s3Service.extractTextFromPdf(key)).rejects.toThrow('File is not a PDF');
    });

    it('should throw error if file does not exist', async () => {
      const key = 'nonexistent.pdf';
      await expect(s3Service.extractTextFromPdf(key)).rejects.toThrow('Failed to extract text from PDF');
    });

    it('should extract text from valid PDF file', async () => {
      const key = 'test.pdf';
      const pdfHeader = Buffer.from('%PDF-1.4\n');
      const pdfContent = Buffer.from('1 0 obj\n<<>>\nendobj\n');
      const pdfFooter = Buffer.from('%%EOF');
      const buffer = Buffer.concat([pdfHeader, pdfContent, pdfFooter]);
      
      s3Service.putFile(key, buffer);
      
      const text = await s3Service.extractTextFromPdf(key);
      expect(typeof text).toBe('string');
    });
  });
}); 