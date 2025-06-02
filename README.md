# Zero Trust Confidential Files API

A secure, serverless API implementation following Zero Trust Architecture principles for handling confidential files. This project demonstrates how to build a secure file handling system using AWS Lambda and API Gateway with the Serverless Framework, implementing strict security controls and zero-trust principles.

## Zero Trust Architecture Principles

This project implements the following Zero Trust principles:

- **Never Trust, Always Verify**: Every request is authenticated and authorized, regardless of its origin
- **Least Privilege Access**: Strict access controls and minimal permissions for all operations
- **Micro-segmentation**: Isolated functions and resources with strict boundaries
- **Encryption Everywhere**: Data encryption at rest and in transit
- **Defense in Depth**: Multiple layers of security controls

## Architecture Overview

The system is built using:
- Serverless Framework for handling deployments and monitoring
- AWS Lambda for serverless compute
- API Gateway for secure API endpoints
- Resend API for sending emails 
- Serverless CI/CD pipeline

## Security Features

- End-to-end encryption for file handling
- JWT-based authentication
- Secure file storage with encryption at rest
- MFA enabled mandatory for all users

## Prerequisites

- Node.js 20.x or later
- AWS CLI configured with appropriate credentials
- Serverless Framework installed globally

## Installation

```bash
npm install
```

## Configuration

1. Set up your AWS credentials
2. Configure environment variables in `.env` file
3. Configure your params on serverless dashboard:
   - `resendApiKey`: API key for Resend email service
   - `jwtSecret`: Secret key for JWT token generation
   - `emailFrom`: Email address for sending notifications
   - `s3UploadBucketName`: Base name for the S3 bucket (will be appended with stage)
4. Update the `serverless.yml` with your specific requirements

## Deployment

Deploy the service using:

```bash
serverless deploy --stage dev  # or prod, staging, etc.
```

The deployment will create:
- DynamoDB tables for Users and MFA codes
- S3 bucket for file uploads with encryption
- Lambda functions with appropriate IAM roles
- API Gateway endpoints with JWT authorization

## API Endpoints

The API provides the following secure endpoints:

- `POST /signup` - Register a new user
- `POST /signin` - Authenticate user and initiate MFA
- `POST /verify-mfa` - Verify MFA code
- `POST /files/get-upload-url` - Get presigned URL for file upload (requires authentication)
- `GET /files/list` - Get List of files uploaded by the user (requires authentication)
- `GET /files/get-download-url/{fileName}` - Get a presigned URL for download the file (requires authentication)

All endpoints require proper authentication and authorization.

## Security Best Practices

1. Always use HTTPS for all API calls
2. Implement proper authentication for all requests
3. Use environment variables for sensitive configuration
4. Regularly rotate encryption keys
5. Monitor and audit all access attempts

## Monitoring and Logging

The system uses Serverless Dashboard for comprehensive monitoring and logging:

1. **Serverless Dashboard**
   - Real-time function monitoring
   - Performance metrics and insights
   - Error tracking and debugging
   - Deployment history and rollback capabilities
   - Custom metrics and alerts
   - Team collaboration features

2. **AWS Integration**
   - CloudWatch Logs for detailed operation logs
   - CloudWatch Metrics for performance monitoring
   - AWS X-Ray for request tracing
   - Custom audit logs for security events

To access the monitoring dashboard:
1. Log in to your Serverless Dashboard account
2. Navigate to the `zero-trust-confidential-files-api` service
3. Use the monitoring section to:
   - View real-time function invocations
   - Monitor error rates and latencies
   - Set up custom alerts
   - Track resource usage
   - View deployment history

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
