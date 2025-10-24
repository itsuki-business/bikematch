// Mock configuration for local development
import mockAuthService from './services/mockAuthService';
import mockAPIService from './services/mockAPIService';
import mockStorageService from './services/mockStorageService';

// Mock Amplify services
const mockAmplify = {
  // Mock Auth
  Auth: {
    signUp: mockAuthService.signUp.bind(mockAuthService),
    confirmSignUp: mockAuthService.confirmSignUp.bind(mockAuthService),
    signIn: mockAuthService.signIn.bind(mockAuthService),
    getCurrentUser: mockAuthService.getCurrentUser.bind(mockAuthService),
    fetchUserAttributes: mockAuthService.fetchUserAttributes.bind(mockAuthService),
    signOut: mockAuthService.signOut.bind(mockAuthService),
    resendSignUpCode: mockAuthService.resendSignUpCode.bind(mockAuthService)
  },
  
  // Mock API
  API: {
    graphql: mockAPIService.graphql.bind(mockAPIService)
  },
  
  // Mock Storage
  Storage: {
    uploadData: mockStorageService.uploadData.bind(mockStorageService),
    getUrl: mockStorageService.getUrl.bind(mockStorageService),
    remove: mockStorageService.remove.bind(mockStorageService),
    list: mockStorageService.list.bind(mockStorageService)
  }
};

// Mock Hub for event handling
const mockHub = {
  listen: (channel, callback) => {
    console.log('Mock Hub listen:', channel);
    // Return unsubscribe function
    return () => console.log('Mock Hub unsubscribe:', channel);
  },
  dispatch: (channel, payload) => {
    console.log('Mock Hub dispatch:', channel, payload);
  }
};

// Export mock services
export { mockAuthService, mockAPIService, mockStorageService, mockHub };
export default mockAmplify;

