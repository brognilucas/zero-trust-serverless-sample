import {S3Service} from '../services/s3Service.js';

export const createHandler = (s3Service = new S3Service()) => {
    return async (event) => {
        const { email } = event.requestContext.authorizer.lambda;
        if (!email) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'User email not found in token' })
            }
        }

        try {
            const files = await s3Service.getFiles(email);
            return {
                statusCode: 200,
                body: JSON.stringify({ files })
            }
        } catch (error) {
            console.error('Failed to get files', error);
            return {   
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to get files' })
            }
        }
    }
}

export const handler = createHandler();