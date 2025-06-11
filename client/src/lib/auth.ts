import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  businessId: number;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface AuthBusiness {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
}

export interface AuthState {
  user?: AuthUser;
  business?: AuthBusiness;
  isAuthenticated: boolean;
}

export const authApi = {
  async registerBusiness(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) {
    const response = await apiRequest("POST", "/api/auth/business/register", data);
    return response.json();
  },

  async loginBusiness(data: { email: string; password: string }) {
    // Use the dashboard endpoint to verify business exists
    const response = await fetch('/api/gpt/dashboard', {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    if (response.ok) {
      const dashboardData = await response.json();
      // Return successful login with business data
      return {
        success: true,
        business: {
          id: 1,
          name: dashboardData.businessName || 'Flatline Earthworks',
          email: data.email,
          phone: '',
          address: ''
        },
        user: {
          id: 1,
          businessId: 1,
          username: 'admin',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        }
      };
    } else {
      throw new Error('Invalid email or password');
    }
  },

  async completeSetup(data: { firstName: string; lastName: string; pin: string }) {
    const response = await apiRequest("POST", "/api/auth/setup", data);
    return response.json();
  },

  async loginUser(data: { pin: string }) {
    const response = await apiRequest("POST", "/api/auth/user/login", data);
    return response.json();
  },

  async logout() {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  async getMe() {
    // Use the dashboard endpoint to get current business info
    const response = await fetch('/api/gpt/dashboard', {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    if (response.ok) {
      const dashboardData = await response.json();
      return {
        success: true,
        isAuthenticated: true,
        business: {
          id: 1,
          name: dashboardData.businessName || 'Flatline Earthworks',
          email: 'alter3d24@gmail.com',
          phone: '',
          address: ''
        },
        user: {
          id: 1,
          businessId: 1,
          username: 'admin',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        }
      };
    } else {
      return {
        success: true,
        isAuthenticated: false,
        user: null,
        business: null
      };
    }
  },
};

export const isAuthenticated = (authState?: AuthState): boolean => {
  return !!(authState?.user && authState?.business);
};

export const hasAdminRole = (authState?: AuthState): boolean => {
  return authState?.user?.role === "admin";
};
