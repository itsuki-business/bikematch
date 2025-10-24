// Mock Storage service for local development

class MockStorageService {
  constructor() {
    this.files = new Map();
  }

  // Mock upload data
  async uploadData({ key, data, options }) {
    console.log('Mock uploadData:', { key, options });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store file data
    this.files.set(key, {
      key: key,
      data: data,
      contentType: options?.contentType || 'image/jpeg',
      uploadedAt: new Date().toISOString()
    });
    
    return {
      key: key,
      result: {
        key: key
      }
    };
  }

  // Mock get URL
  async getUrl({ key }) {
    console.log('Mock getUrl:', { key });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const file = this.files.get(key);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Return mock URL
    return {
      url: `https://mock-s3-bucket.s3.amazonaws.com/${key}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
  }

  // Mock remove
  async remove({ key }) {
    console.log('Mock remove:', { key });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.files.delete(key);
    
    return {
      key: key
    };
  }

  // Mock list
  async list({ prefix, options }) {
    console.log('Mock list:', { prefix, options });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const files = Array.from(this.files.values());
    const filteredFiles = prefix 
      ? files.filter(file => file.key.startsWith(prefix))
      : files;
    
    return {
      items: filteredFiles.map(file => ({
        key: file.key,
        size: file.data?.size || 0,
        lastModified: file.uploadedAt
      }))
    };
  }
}

// Create singleton instance
const mockStorageService = new MockStorageService();

export default mockStorageService;

