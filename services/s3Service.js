import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PDFParser from 'pdf2json';

export class S3Service {
  constructor() {
  }

  async getUploadPresignedUrl(key) {
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    return await getSignedUrl(client, command, { expiresIn: process.env.S3_PRESIGNED_URL_EXPIRATION });
  }

  async getFiles(email) {
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${email}/`
    });
    const response = await client.send(command);
    return (response.Contents || []).map(item => item.Key.split('/').pop());
  }

  async getDownloadPresignedUrl(email, fileName) {
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;
    const key = `${email}/${fileName}`;
    try {
      await client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    return await getSignedUrl(client, command, { expiresIn: process.env.S3_PRESIGNED_URL_EXPIRATION });
  }

  async extractTextFromPdf(key) {
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;

    try {
      console.log("fetching object from key " + key);
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const response = await client.send(command);
      
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      const isPdf = buffer.length > 4 && 
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46;   // F

      if (!isPdf) {
        throw new Error('File is not a PDF');
      }

      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            const pages = pdfData.Pages;
            const textContent = pages.map(page => {
              const texts = page.Texts.map(text => {
                // Decode the text content which is usually encoded
                return decodeURIComponent(text.R[0].T);
              });
              return texts.join(' ');
            }).join('\n');

            console.log('Text extracted successfully');
            resolve(textContent);
          } catch (error) {
            console.error('Error extracting text from parsed PDF:', error);
            reject(new Error(`Failed to extract text from PDF: ${error.message}`));
          }
        });

        pdfParser.on('pdfParser_dataError', (error) => {
          console.error('Error parsing PDF:', error);
          reject(new Error(`Failed to parse PDF: ${error.message}`));
        });

        try {
          console.log('Starting PDF parsing...');
          pdfParser.parseBuffer(buffer);
        } catch (error) {
          console.error('Error during PDF parsing:', error);
          reject(new Error(`Failed to parse PDF: ${error.message}`));
        }
      });
    } catch (error) {
      if (error.message === 'File is not a PDF') {
        throw error;
      }
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}

