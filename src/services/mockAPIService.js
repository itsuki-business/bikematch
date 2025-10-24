// Mock API service for local development

class MockAPIService {
  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    this.loadFromStorage();
  }

  // localStorageからデータを読み込み
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('mockAPIData');
      if (stored) {
        const data = JSON.parse(stored);
        this.users = new Map(data.users || []);
        this.portfolios = new Map(data.portfolios || []);
        this.conversations = new Map(data.conversations || []);
        this.messages = new Map(data.messages || []);
        this.reviews = new Map(data.reviews || []);
        console.log('Mock API data loaded from storage');
      }
    } catch (error) {
      console.error('Error loading mock API data:', error);
    }
  }

  // localStorageにデータを保存
  saveToStorage() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        portfolios: Array.from(this.portfolios.entries()),
        conversations: Array.from(this.conversations.entries()),
        messages: Array.from(this.messages.entries()),
        reviews: Array.from(this.reviews.entries())
      };
      localStorage.setItem('mockAPIData', JSON.stringify(data));
      console.log('Mock API data saved to storage');
    } catch (error) {
      console.error('Error saving mock API data:', error);
    }
  }

  // Mock GraphQL client
  async graphql({ query, variables, authMode }) {
    console.log('Mock GraphQL:', { query, variables, authMode });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Parse query to determine operation
    const operationName = this.extractOperationName(query);
    console.log('Extracted operation name:', operationName);
    
    switch (operationName) {
      case 'createuser':
        return this.mockCreateUser(variables.input);
      case 'updateuser':
        return this.mockUpdateUser(variables.input);
      case 'getuser':
        return this.mockGetUser(variables.id);
      case 'listusers':
        return this.mockListUsers(variables.filter);
      case 'createportfolio':
        return this.mockCreatePortfolio(variables.input);
      case 'deleteportfolio':
        return this.mockDeletePortfolio(variables.input);
      case 'listportfolios':
        return this.mockListPortfolios(variables.filter);
      default:
        throw new Error(`Mock operation not implemented: ${operationName}`);
    }
  }

  extractOperationName(query) {
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  // Mock create user
  mockCreateUser(input) {
    console.log('mockCreateUser called with input:', input);
    
    const user = {
      id: input.id,
      email: input.email,
      nickname: input.nickname,
      user_type: input.user_type,
      prefecture: input.prefecture,
      bike_maker: input.bike_maker,
      bike_model: input.bike_model,
      shooting_genres: input.shooting_genres || [],
      price_range_min: input.price_range_min,
      price_range_max: input.price_range_max,
      equipment: input.equipment,
      bio: input.bio,
      profile_image: input.profile_image,
      portfolio_website: input.portfolio_website,
      instagram_url: input.instagram_url,
      twitter_url: input.twitter_url,
      youtube_url: input.youtube_url,
      special_conditions: input.special_conditions || [],
      is_accepting_requests: input.is_accepting_requests,
      average_rating: input.average_rating || 0,
      review_count: input.review_count || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _version: 1
    };
    
    console.log('mockCreateUser created user:', user);
    
    this.users.set(input.id, user);
    this.saveToStorage(); // データを永続化
    
    console.log('mockCreateUser - users Map after save:', Array.from(this.users.entries()));
    
    return {
      data: {
        createUser: user
      }
    };
  }

  // Mock update user
  mockUpdateUser(input) {
    const existingUser = this.users.get(input.id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...existingUser,
      ...input,
      updatedAt: new Date().toISOString(),
      _version: existingUser._version + 1
    };
    
    this.users.set(input.id, updatedUser);
    
    return {
      data: {
        updateUser: updatedUser
      }
    };
  }

  // Mock get user
  mockGetUser(id) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      data: {
        getUser: user
      }
    };
  }

  // Mock list users
  mockListUsers(filter) {
    const users = Array.from(this.users.values());
    
    let filteredUsers = users;
    if (filter) {
      if (filter.user_type) {
        filteredUsers = filteredUsers.filter(user => user.user_type === filter.user_type.eq);
      }
      if (filter.is_accepting_requests) {
        filteredUsers = filteredUsers.filter(user => user.is_accepting_requests === filter.is_accepting_requests.eq);
      }
    }
    
    return {
      data: {
        listUsers: {
          items: filteredUsers,
          nextToken: null
        }
      }
    };
  }

  // Mock create portfolio
  mockCreatePortfolio(input) {
    const portfolio = {
      id: 'portfolio-' + Date.now(),
      photographer_id: input.photographer_id,
      image_key: input.image_key,
      title: input.title,
      description: input.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _version: 1
    };
    
    this.portfolios.set(portfolio.id, portfolio);
    
    return {
      data: {
        createPortfolio: portfolio
      }
    };
  }

  // Mock delete portfolio
  mockDeletePortfolio(input) {
    const portfolio = this.portfolios.get(input.id);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    
    this.portfolios.delete(input.id);
    
    return {
      data: {
        deletePortfolio: portfolio
      }
    };
  }

  // Mock list portfolios
  mockListPortfolios(filter) {
    const portfolios = Array.from(this.portfolios.values());
    
    let filteredPortfolios = portfolios;
    if (filter && filter.photographer_id) {
      filteredPortfolios = filteredPortfolios.filter(portfolio => 
        portfolio.photographer_id === filter.photographer_id.eq
      );
    }
    
    return {
      data: {
        listPortfolios: {
          items: filteredPortfolios,
          nextToken: null
        }
      }
    };
  }
}

// Create singleton instance
const mockAPIService = new MockAPIService();

export default mockAPIService;

