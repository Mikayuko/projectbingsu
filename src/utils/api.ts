// src/utils/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Type definitions
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'customer' | 'admin';
  loyaltyPoints: number;
  loyaltyCard: {
    stamps: number;
    totalFreeDrinks: number;
  };
}

export interface Order {
  _id: string;
  orderId: string;
  customerCode: string;
  cupSize: 'S' | 'M' | 'L';
  shavedIce: {
    flavor: string;
    points: number;
  };
  toppings: Array<{
    name: string;
    points: number;
  }>;
  pricing: {
    basePrice: number;
    total: number;
  };
  status: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulVotes: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleApiError = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch (e) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  return response;
};

// Check if API is available
const isApiAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      method: 'GET'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// API class for all backend calls
class BingsuAPI {
  // Auth endpoints
  async register(data: { fullName: string; email: string; password: string; confirmPassword: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      await handleApiError(response);
      const result = await response.json();
      
      // Store token
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Fallback to local registration
      if (data.email && data.password && data.fullName) {
        const mockUser = {
          id: Date.now().toString(),
          fullName: data.fullName,
          email: data.email,
          role: data.email.includes('admin') ? 'admin' : 'customer',
          loyaltyPoints: 0,
          loyaltyCard: { stamps: 0, totalFreeDrinks: 0 }
        };
        
        const mockToken = btoa(JSON.stringify({ userId: mockUser.id, email: mockUser.email }));
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        return { token: mockToken, user: mockUser };
      }
      
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      await handleApiError(response);
      const result = await response.json();
      
      // Store token and user
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to demo account validation
      const demoAccounts = [
        { email: 'admin@bingsu.com', password: 'admin123', role: 'admin', name: 'Admin User' },
        { email: 'user@bingsu.com', password: 'user123', role: 'customer', name: 'Test Customer' },
        { email: 'alice@example.com', password: 'alice123', role: 'customer', name: 'Alice Johnson' }
      ];
      
      const account = demoAccounts.find(acc => acc.email === email && acc.password === password);
      
      if (account) {
        const mockUser = {
          id: Date.now().toString(),
          fullName: account.name,
          email: account.email,
          role: account.role as 'customer' | 'admin',
          loyaltyPoints: Math.floor(Math.random() * 100),
          loyaltyCard: { 
            stamps: Math.floor(Math.random() * 9), 
            totalFreeDrinks: Math.floor(Math.random() * 3) 
          }
        };
        
        const mockToken = btoa(JSON.stringify({ userId: mockUser.id, email: mockUser.email }));
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        return { token: mockToken, user: mockUser };
      }
      
      throw error;
    }
  }

  async logout() {
    try {
      // Try API logout first
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.log('API logout failed, using local logout');
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    } catch (error) {
      // Fallback to local user data
      const user = getCurrentUser();
      if (user) {
        return { user };
      }
      throw error;
    }
  }

  // Menu code endpoints
  async generateMenuCode(cupSize: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ cupSize })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      // Generate local code
      const code = Array.from({ length: 5 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');
      
      return { code, cupSize, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
    }
  }

  async validateMenuCode(code: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      console.log('API not available, checking local codes...');
      
      // Check generated codes first (from create-code page)
      const codeMap = JSON.parse(localStorage.getItem('menuCodeMap') || '{}');
      if (codeMap[code.toUpperCase()]) {
        const cupSize = codeMap[code.toUpperCase()];
        console.log('Found generated code:', code, 'with size:', cupSize);
        return { valid: true, cupSize, message: 'Code is valid' };
      }
      
      // Fallback to predefined demo codes
      const validCodes: { [key: string]: string } = {
        'TEST1': 'S', 'TEST2': 'M', 'TEST3': 'L',
        'DEMO1': 'S', 'DEMO2': 'M', 'DEMO3': 'L',
        'ABC12': 'M', 'XYZ99': 'L', 'BING1': 'S', 'BING2': 'M'
      };
      
      const cupSize = validCodes[code.toUpperCase()];
      if (cupSize) {
        console.log('Found demo code:', code, 'with size:', cupSize);
        return { valid: true, cupSize, message: 'Code is valid' };
      }
      
      console.log('Code not found:', code);
      throw new Error('Invalid menu code');
    }
  }

  // Order endpoints
  async createOrder(orderData: {
    menuCode: string;
    shavedIce: { flavor: string; points: number };
    toppings: Array<{ name: string; points: number }>;
    specialInstructions?: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      console.log('API unavailable, creating local order');
      throw error; // Let the calling function handle local creation
    }
  }

  async trackOrder(customerCode: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/track/${customerCode}`);
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      // Check localStorage for order
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      const order = orders.find((o: any) => o.customerCode.toLowerCase() === customerCode.toLowerCase());
      
      if (order) {
        return { order };
      }
      
      throw new Error('Order not found');
    }
  }

  async getMyOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    } catch (error) {
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      return { orders };
    }
  }

  // Admin order endpoints
  async getAllOrders(filters?: { status?: string; date?: string }) {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    } catch (error) {
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      return { orders };
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      throw error; // Let caller handle local update
    }
  }

  async getOrderStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/stats`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    } catch (error) {
      // Generate local stats
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      const today = new Date().toDateString();
      const todayOrders = orders.filter((o: any) => new Date(o.createdAt).toDateString() === today);
      
      return {
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0),
        pendingOrders: orders.filter((o: any) => o.status === 'Pending').length,
        popularFlavors: []
      };
    }
  }

  // Review endpoints
  async createReview(reviewData: {
    rating: number;
    comment: string;
    orderId?: string;
    shavedIceFlavor?: string;
    toppings?: string[];
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(reviewData)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      // Create local review
      const review = {
        _id: Date.now().toString(),
        customerName: getCurrentUser()?.fullName || 'Anonymous',
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString(),
        helpfulVotes: 0
      };
      
      const reviews = JSON.parse(localStorage.getItem('bingsuReviews') || '[]');
      reviews.push(review);
      localStorage.setItem('bingsuReviews', JSON.stringify(reviews));
      
      return { review };
    }
  }

  async getReviews(page = 1, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews?page=${page}&limit=${limit}`);
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    } catch (error) {
      // Return local reviews + default reviews
      const localReviews = JSON.parse(localStorage.getItem('bingsuReviews') || '[]');
      const defaultReviews = [
        {
          _id: '1',
          customerName: 'Alice Johnson',
          rating: 5,
          comment: 'Amazing shaved ice! The matcha flavor was perfect and the toppings were fresh. Will definitely come back!',
          createdAt: '2024-01-15T10:30:00Z',
          helpfulVotes: 12
        },
        {
          _id: '2',
          customerName: 'Bob Smith',
          rating: 4,
          comment: 'Great taste and good portion size. The Thai tea flavor really reminded me of authentic Thai tea. Loved the variety of toppings!',
          createdAt: '2024-01-14T15:45:00Z',
          helpfulVotes: 8
        },
        {
          _id: '3',
          customerName: 'Charlie Brown',
          rating: 4,
          comment: 'Nice and refreshing! Perfect for hot weather. The strawberry flavor was sweet and the ice texture was just right.',
          createdAt: '2024-01-13T14:20:00Z',
          helpfulVotes: 5
        },
        {
          _id: '4',
          customerName: 'Diana Wong',
          rating: 5,
          comment: 'Best bingsu in town! Love how they let you customize with different toppings. The loyalty card system is also a nice touch.',
          createdAt: '2024-01-12T11:15:00Z',
          helpfulVotes: 15
        },
        {
          _id: '5',
          customerName: 'Emma Davis',
          rating: 3,
          comment: 'It was okay, but the ice melted a bit too quickly. The flavors were good though, especially the mango topping.',
          createdAt: '2024-01-11T16:30:00Z',
          helpfulVotes: 3
        }
      ];
      
      const allReviews = [...localReviews, ...defaultReviews];
      const totalReviews = allReviews.length;
      const average = totalReviews > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
      
      return {
        reviews: allReviews.slice(0, limit),
        totalReviews,
        stats: { average }
      };
    }
  }

  async voteHelpful(reviewId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      // Local vote handling could be implemented here
      throw error;
    }
  }
}

export const api = new BingsuAPI();

// Utility functions for auth state
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Helper function to check if we're running in offline/demo mode
export const isOfflineMode = async () => {
  return !(await isApiAvailable());
};