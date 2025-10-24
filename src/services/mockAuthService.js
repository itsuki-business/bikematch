// Mock authentication service for local development

class MockAuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.loadFromStorage();
  }

  // localStorageからデータを読み込み
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('mockAuthData');
      if (stored) {
        const data = JSON.parse(stored);
        this.currentUser = data.currentUser;
        this.isAuthenticated = data.isAuthenticated;
        console.log('Mock auth data loaded from storage:', data);
      }
    } catch (error) {
      console.error('Error loading mock auth data:', error);
    }
  }

  // localStorageにデータを保存
  saveToStorage() {
    try {
      const data = {
        currentUser: this.currentUser,
        isAuthenticated: this.isAuthenticated
      };
      localStorage.setItem('mockAuthData', JSON.stringify(data));
      console.log('Mock auth data saved to storage:', data);
    } catch (error) {
      console.error('Error saving mock auth data:', error);
    }
  }

  // Mock sign up
  async signUp({ username, password, options }) {
    console.log('Mock signUp:', { username, password, options });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      isSignUpComplete: false,
      nextStep: {
        signUpStep: 'CONFIRM_SIGN_UP',
        codeDeliveryDetails: {
          deliveryMedium: 'EMAIL',
          destination: username
        }
      },
      userId: 'mock-user-' + Date.now()
    };
  }

  // Mock confirm sign up
  async confirmSignUp({ username, confirmationCode }) {
    console.log('Mock confirmSignUp:', { username, confirmationCode });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock環境では確認コード "123456" を正しいコードとして扱う
    if (confirmationCode !== '123456') {
      const error = new Error('Invalid verification code');
      error.code = 'CodeMismatchException';
      throw error;
    }
    
    // Set mock user as authenticated
    this.currentUser = {
      userId: 'mock-user-fixed-id', // 固定のユーザーID
      username: username,
      attributes: {
        email: username, // メールアドレスを正しく設定
        name: username.split('@')[0], // 名前を正しく設定
        sub: 'mock-user-fixed-id' // 固定のsub
      }
    };
    this.isAuthenticated = true;
    this.saveToStorage(); // データを永続化
    
    console.log('Mock user authenticated after confirmation:', this.currentUser);
    console.log('Mock user attributes:', this.currentUser.attributes);
    
    return {
      isSignUpComplete: true,
      nextStep: {
        signUpStep: 'DONE'
      }
    };
  }

  // Mock sign in
  async signIn({ username, password }) {
    console.log('Mock signIn:', { username, password });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.currentUser = {
      userId: 'mock-user-fixed-id', // 固定のユーザーID
      username: username,
      attributes: {
        email: username, // メールアドレスを正しく設定
        name: username.split('@')[0], // 名前を正しく設定
        sub: 'mock-user-fixed-id' // 固定のsub
      }
    };
    this.isAuthenticated = true;
    this.saveToStorage(); // データを永続化
    
    return {
      isSignedIn: true,
      nextStep: {
        signInStep: 'DONE'
      }
    };
  }

  // Mock get current user
  async getCurrentUser() {
    console.log('Mock getCurrentUser');
    
    if (!this.isAuthenticated) {
      throw new Error('User is not authenticated');
    }
    
    return this.currentUser;
  }

  // Mock fetch user attributes
  async fetchUserAttributes() {
    console.log('Mock fetchUserAttributes');
    
    if (!this.isAuthenticated) {
      throw new Error('User is not authenticated');
    }
    
    return this.currentUser.attributes;
  }

  // Mock sign out
  async signOut() {
    console.log('Mock signOut');
    
    this.currentUser = null;
    this.isAuthenticated = false;
    this.saveToStorage(); // データを永続化
    
    return {};
  }

  // Mock resend sign up code
  async resendSignUpCode({ username }) {
    console.log('Mock resendSignUpCode:', { username });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      codeDeliveryDetails: {
        deliveryMedium: 'EMAIL',
        destination: username
      }
    };
  }

  // Mock環境のユーザーデータをリセット
  resetMockData() {
    console.log('Resetting mock auth data');
    this.currentUser = null;
    this.isAuthenticated = false;
  }
}

// Create singleton instance
const mockAuthService = new MockAuthService();

export default mockAuthService;

