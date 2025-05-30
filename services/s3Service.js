import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
}

