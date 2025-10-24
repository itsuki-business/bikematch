/* eslint-disable */
// Mock configuration for local development

const awsmobile = {
    "aws_project_region": "us-east-1",
    "aws_appsync_graphqlEndpoint": "http://localhost:20002/graphql",
    "aws_appsync_region": "us-east-1",
    "aws_appsync_authenticationType": "API_KEY",
    "aws_appsync_apiKey": "da2-mock-api-key-for-local-development",
    "aws_cognito_identity_pool_id": "us-east-1:mock-identity-pool-id",
    "aws_cognito_region": "us-east-1",
    "aws_user_pools_id": "us-east-1_MOCK_POOL_ID",
    "aws_user_pools_web_client_id": "mock-web-client-id",
    "oauth": {},
    "aws_cognito_username_attributes": [
        "EMAIL"
    ],
    "aws_cognito_social_providers": [],
    "aws_cognito_signup_attributes": [
        "EMAIL"
    ],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": [
        "SMS"
    ],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": [
        "EMAIL"
    ],
    "aws_user_files_s3_bucket": "mock-s3-bucket",
    "aws_user_files_s3_bucket_region": "us-east-1"
};

export default awsmobile;

