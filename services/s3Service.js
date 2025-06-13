import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

  async getDownloadPresignedUrl(key) {
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      await client.send(command);
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

  async getFile(key) {
    console.log("Fetching object from key " + key);
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    const bucketName = process.env.S3_UPLOAD_BUCKET_NAME;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    try {
      const response = await client.send(command);
      const buffer = await this.#mapS3BodyToBuffer(response.Body);
      return {
        buffer: buffer,
        mimeType: response.ContentType
      };
    } catch (error) {
      console.error(`Error fetching file from S3 (Key: ${key}):`, error);
      throw new Error(`Failed to retrieve file from S3: ${error.message}`);
    }
  }

  async #mapS3BodyToBuffer(body) {
    const chunks = [];
    if (body) {
      for await (const chunk of body) {
        chunks.push(chunk);
      }
    } else {
      throw new Error(`S3 object body was empty for key: ${key}`);
    }
    const buffer = Buffer.concat(chunks);
    return buffer
  }
}

