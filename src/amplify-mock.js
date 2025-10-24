import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports-mock';

// Mock Amplify configuration for local development
Amplify.configure({
  ...awsExports,
  // Mock authentication
  Auth: {
    Cognito: {
      userPoolId: awsExports.aws_user_pools_id,
      userPoolClientId: awsExports.aws_user_pools_web_client_id,
      region: awsExports.aws_cognito_region,
      // Mock user for development
      mockUser: {
        userId: 'mock-user-123',
        username: 'test@example.com',
        attributes: {
          email: 'test@example.com',
          name: 'テストユーザー',
          sub: 'mock-user-123'
        }
      }
    }
  },
  // Mock API
  API: {
    GraphQL: {
      endpoint: awsExports.aws_appsync_graphqlEndpoint,
      region: awsExports.aws_appsync_region,
      defaultAuthMode: 'apiKey',
      apiKey: awsExports.aws_appsync_apiKey
    }
  },
  // Mock Storage
  Storage: {
    S3: {
      bucket: awsExports.aws_user_files_s3_bucket,
      region: awsExports.aws_user_files_s3_bucket_region
    }
  }
});

export default Amplify;

