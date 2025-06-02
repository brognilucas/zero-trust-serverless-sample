import { S3Service } from "../services/s3Service.js";

export const createHandler = (s3Service = new S3Service()) => {
    return async (event) => {
        console.log('getPresignedURLForDownload', event);
        try {
            const { email } = event.requestContext.authorizer.lambda;
            if (!email) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: 'User not authenticated' }),
                };
            }
            const { fileName } = event.pathParameters ?? {}; 
            if (!fileName) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'fileName is required' }),
                };
            }
            const presignedURL = await s3Service.getDownloadPresignedUrl(email, fileName);
            if (!presignedURL) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'File not found' }),
                };
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ presignedURL }),
            };
        } catch (error) {
            console.error('Failed to get presigned URL', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to get presigned URL with error: ' + error.message , event }),
            };
        }
    }
}

export const handler = createHandler();