// BikeMatch API Client
// This replaces the base44 SDK with a custom implementation suitable for AWS deployment

class BikeMatchAPI {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.currentUser = null;
    this.initializeDatabase();
  }

  // Initialize mock database in localStorage
  initializeDatabase() {
    // Clear all BikeMatch data only once
    if (!localStorage.getItem('bikematch_initialized')) {
      localStorage.removeItem('bikematch_users_db');
      localStorage.removeItem('bikematch_current_user');
      localStorage.removeItem('bikematch_conversations');
      localStorage.removeItem('bikematch_messages');
      localStorage.removeItem('bikematch_portfolio');
      localStorage.setItem('bikematch_initialized', 'true');
    }
    
    if (!localStorage.getItem('bikematch_users_db')) {
      const initialUsers = [];
      localStorage.setItem('bikematch_users_db', JSON.stringify(initialUsers));
    }
  }

  // Database helper methods
  getUsersFromDB() {
    return JSON.parse(localStorage.getItem('bikematch_users_db') || '[]');
  }

  saveUsersToDB(users) {
    localStorage.setItem('bikematch_users_db', JSON.stringify(users));
  }

  findUserByEmail(email) {
    const users = this.getUsersFromDB();
    return users.find(user => user.email === email);
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Authentication methods
  auth = {
    me: async () => {
      // Check current session
      if (this.currentUser) {
        return this.currentUser;
      }
      
      // Check localStorage for user session
      const userData = localStorage.getItem('bikematch_current_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
      
      throw new Error('Not authenticated');
    },

    login: async (credentials) => {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('メールアドレスとパスワードを入力してください');
      }

      if (!this.validateEmail(credentials.email)) {
        throw new Error('正しいメールアドレス形式で入力してください');
      }

      // Find user in database
      const user = this.findUserByEmail(credentials.email);
      if (!user) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // Check password
      if (user.password !== credentials.password) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // Create session (exclude password from session)
      const sessionUser = { ...user };
      delete sessionUser.password;
      
      this.currentUser = sessionUser;
      localStorage.setItem('bikematch_current_user', JSON.stringify(sessionUser));
      return sessionUser;
    },

    logout: (redirectUrl) => {
      this.currentUser = null;
      localStorage.removeItem('bikematch_current_user');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    register: async (userData) => {
      // Validate input
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('すべての項目を入力してください');
      }

      if (!this.validateEmail(userData.email)) {
        throw new Error('正しいメールアドレス形式で入力してください（例: example@email.com）');
      }

      if (userData.password.length < 6) {
        throw new Error('パスワードは6文字以上で入力してください');
      }

      // Check if email already exists
      const existingUser = this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('このメールアドレスは既に登録されています');
      }

      // Create new user
      const users = this.getUsersFromDB();
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password,
        name: userData.name,
        user_type: userData.user_type || null, // nullを許可、プロフィールで設定
        profile_image: null,
        average_rating: 0,
        review_count: 0,
        is_accepting_requests: false, // デフォルトは募集しない
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsersToDB(users);

      // Create session (exclude password from session)
      const sessionUser = { ...newUser };
      delete sessionUser.password;
      
      this.currentUser = sessionUser;
      localStorage.setItem('bikematch_current_user', JSON.stringify(sessionUser));
      return sessionUser;
    },

    updateMe: async (data) => {
      if (!this.currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Update in database
      const users = this.getUsersFromDB();
      const userIndex = users.findIndex(u => u.id === this.currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        this.saveUsersToDB(users);
      }
      
      // Update current session
      this.currentUser = { ...this.currentUser, ...data };
      localStorage.setItem('bikematch_current_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  };

  // Entity management
  entities = {
    Conversation: {
      list: async () => {
        // Get conversations from localStorage
        const conversations = JSON.parse(localStorage.getItem('bikematch_conversations') || '[]');
        // Filter out conversations older than 1 year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const validConversations = conversations.filter(conv => {
          const lastActivity = new Date(conv.last_message_at || conv.created_date);
          return lastActivity > oneYearAgo;
        });
        // Update localStorage if any were filtered out
        if (validConversations.length !== conversations.length) {
          localStorage.setItem('bikematch_conversations', JSON.stringify(validConversations));
        }
        return validConversations;
      },

      filter: async (filters) => {
        const conversations = JSON.parse(localStorage.getItem('bikematch_conversations') || '[]');
        return conversations.filter(conv => {
          return Object.keys(filters).every(key => conv[key] === filters[key]);
        });
      },

      create: async (data) => {
        const conversations = JSON.parse(localStorage.getItem('bikematch_conversations') || '[]');
        const conversation = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString(),
          last_message_date: new Date().toISOString()
        };
        conversations.push(conversation);
        localStorage.setItem('bikematch_conversations', JSON.stringify(conversations));
        return conversation;
      },

      update: async (id, data) => {
        const conversations = JSON.parse(localStorage.getItem('bikematch_conversations') || '[]');
        const index = conversations.findIndex(c => c.id === id);
        if (index !== -1) {
          conversations[index] = { ...conversations[index], ...data };
          localStorage.setItem('bikematch_conversations', JSON.stringify(conversations));
          return conversations[index];
        }
        return { id, ...data };
      }
    },

    Message: {
      filter: async (filters, sortBy) => {
        const messages = JSON.parse(localStorage.getItem('bikematch_messages') || '[]');
        // Filter out messages older than 1 year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const validMessages = messages.filter(msg => {
          const messageDate = new Date(msg.created_date);
          return messageDate > oneYearAgo;
        });
        // Update localStorage if any were filtered out
        if (validMessages.length !== messages.length) {
          localStorage.setItem('bikematch_messages', JSON.stringify(validMessages));
        }
        // Apply filters
        let filtered = validMessages.filter(msg => {
          return Object.keys(filters).every(key => msg[key] === filters[key]);
        });
        // Sort if sortBy specified
        if (sortBy) {
          filtered.sort((a, b) => new Date(a[sortBy]) - new Date(b[sortBy]));
        }
        return filtered;
      },

      create: async (data) => {
        const messages = JSON.parse(localStorage.getItem('bikematch_messages') || '[]');
        const message = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        messages.push(message);
        localStorage.setItem('bikematch_messages', JSON.stringify(messages));
        return message;
      }
    },

    User: {
      list: async () => {
        // Get users from database (exclude passwords)
        const users = this.getUsersFromDB();
        return users.map(user => {
          const { password, ...userWithoutPassword } = user;
          // Ensure is_accepting_requests field exists for photographers
          if (userWithoutPassword.user_type === 'photographer' && userWithoutPassword.is_accepting_requests === undefined) {
            userWithoutPassword.is_accepting_requests = false;
          }
          return userWithoutPassword;
        });
      }
    },

    Review: {
      filter: async (filters, sortBy) => {
        // Mock reviews data
        return [
          {
            id: '1',
            conversation_id: filters.conversation_id,
            reviewer_id: filters.reviewer_id || '1',
            reviewee_id: filters.reviewee_id || '2',
            rating: 5,
            comment: 'Great photographer! Highly recommended.',
            created_date: new Date().toISOString()
          }
        ];
      },

      create: async (data) => {
        const review = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        return review;
      }
    },

    Portfolio: {
      filter: async (filters) => {
        // Get portfolio from localStorage
        const portfolio = JSON.parse(localStorage.getItem('bikematch_portfolio') || '[]');
        return portfolio.filter(item => {
          return Object.keys(filters).every(key => item[key] === filters[key]);
        });
      },

      create: async (data) => {
        const portfolio = JSON.parse(localStorage.getItem('bikematch_portfolio') || '[]');
        const newItem = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        portfolio.push(newItem);
        localStorage.setItem('bikematch_portfolio', JSON.stringify(portfolio));
        return newItem;
      },

      delete: async (id) => {
        const portfolio = JSON.parse(localStorage.getItem('bikematch_portfolio') || '[]');
        const filteredPortfolio = portfolio.filter(item => item.id !== id);
        localStorage.setItem('bikematch_portfolio', JSON.stringify(filteredPortfolio));
        return { success: true };
      }
    }
  };

  // Integrations
  integrations = {
    Core: {
      UploadFile: async ({ file }) => {
        // Convert file to Base64 for persistent storage
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file_url: reader.result // Base64 data URL
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    }
  };
}

// Create and export the client instance
export const bikematch = new BikeMatchAPI();

// For backward compatibility, also export as base44
export const base44 = bikematch;
