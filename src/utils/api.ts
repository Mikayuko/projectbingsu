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
      // If JSON parsing fails or any other error
      if (e instanceof Error && e.message.includes('HTTP')) {
        throw e; // Re-throw if it's already an HTTP error
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  return response;
};

// Check if API is available
const isApiAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.log('API logout failed, using local logout');
    } finally {
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
      const user = getCurrentUser();
      if (user) {
        return { user };
      }
      throw error;
    }
  }

  // User Management endpoints
  async getAllUsers(filters?: { role?: string; isActive?: string; search?: string }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/users/admin/all?${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }
    
    return response.json();
  }

  async updateUser(userId: string, updates: {
    fullName?: string;
    email?: string;
    role?: string;
    loyaltyPoints?: number;
    loyaltyCard?: any;
    isActive?: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }
    
    return response.json();
  }

  async deleteUser(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
    
    return response.json();
  }

  async toggleUserStatus(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle user status');
    }
    
    return response.json();
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
      const codeMap = JSON.parse(localStorage.getItem('menuCodeMap') || '{}');
      if (codeMap[code.toUpperCase()]) {
        return { valid: true, cupSize: codeMap[code.toUpperCase()], message: 'Code is valid' };
      }
      
      const validCodes: { [key: string]: string } = {
        'TEST1': 'S', 'TEST2': 'M', 'TEST3': 'L',
        'DEMO1': 'S', 'DEMO2': 'M', 'DEMO3': 'L',
        'ABC12': 'M', 'XYZ99': 'L', 'BING1': 'S', 'BING2': 'M'
      };
      
      const cupSize = validCodes[code.toUpperCase()];
      if (cupSize) {
        return { valid: true, cupSize, message: 'Code is valid' };
      }
      
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
      throw error;
    }
  }

  async trackOrder(customerCode: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/track/${customerCode}`);
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
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
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      return { orders };
    }
  }

  async getAllOrders(filters?: { status?: string; date?: string }) {
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    } catch (error) {
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
      throw error;
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

export const isOfflineMode = async () => {
  return !(await isApiAvailable());
};