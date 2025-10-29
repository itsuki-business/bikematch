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
        console.log('Mock auth data loaded from storage:', {
          hasCurrentUser: !!this.currentUser,
          isAuthenticated: this.isAuthenticated,
          userId: this.currentUser?.userId,
          username: this.currentUser?.username
        });
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
    
    // 新規登録時の情報を一時保存（確認コード入力後に正式登録）
    const pendingUser = {
      email: username,
      password: password, // 実際のアプリではハッシュ化すべき
      name: options?.userAttributes?.name || username.split('@')[0],
      registeredAt: Date.now()
    };
    
    localStorage.setItem('mockPendingUser', JSON.stringify(pendingUser));
    console.log('Mock pending user saved:', pendingUser);
    
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
    
    // 一時保存されたユーザー情報を取得
    const pendingUserData = localStorage.getItem('mockPendingUser');
    let pendingUser = null;
    if (pendingUserData) {
      try {
        pendingUser = JSON.parse(pendingUserData);
        console.log('Mock confirmSignUp - Found pending user:', pendingUser);
      } catch (error) {
        console.error('Error parsing pending user data:', error);
      }
    } else {
      console.log('Mock confirmSignUp - No pending user data found');
    }
    
    // ランダムな16文字の英数字IDを生成
    const generateRandomId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const mockUserId = generateRandomId();
    
    // Set mock user as authenticated
    this.currentUser = {
      userId: mockUserId, // ランダムなユーザーID
      generatedId: mockUserId, // generatedIdも同じ値に設定
      username: username,
      attributes: {
        email: pendingUser?.email || username, // 登録時のメールアドレス
        name: pendingUser?.name || username.split('@')[0], // 登録時のニックネーム
        sub: mockUserId // ランダムなsub
      }
    };
    this.isAuthenticated = true;
    this.saveToStorage(); // データを永続化
    
    console.log('Mock user authenticated after confirmation:', this.currentUser);
    console.log('Mock user attributes:', this.currentUser.attributes);
    console.log('Mock auth data saved to localStorage');
    
    // 一時データを削除
    localStorage.removeItem('mockPendingUser');
    console.log('Mock pending user data removed from localStorage');
    
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
    
    // ランダムな16文字の英数字IDを生成
    const generateRandomId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const mockUserId = generateRandomId();
    
    this.currentUser = {
      userId: mockUserId, // ランダムなユーザーID
      generatedId: mockUserId, // generatedIdも同じ値に設定
      username: username,
      attributes: {
        email: username, // メールアドレスを正しく設定
        name: username.split('@')[0], // 名前を正しく設定
        sub: mockUserId // ランダムなsub
      }
    };
    this.isAuthenticated = true;
    this.saveToStorage(); // データを永続化
    
    console.log('Mock user authenticated after sign in:', this.currentUser);
    console.log('Mock auth data saved to localStorage');
    
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

  // Mock環境でユーザー名を更新
  updateUsername(nickname) {
    console.log('Mock updateUsername:', nickname);
    if (this.currentUser) {
      this.currentUser.username = nickname;
      this.saveToStorage(); // データを永続化
      console.log('Mock username updated:', this.currentUser);
    }
  }
}

// Create singleton instance
const mockAuthService = new MockAuthService();

export default mockAuthService;

