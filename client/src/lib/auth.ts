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
    const response = await apiRequest("POST", "/api/auth/business/login", data);
    return response.json();
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
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};

export const isAuthenticated = (authState?: AuthState): boolean => {
  return !!(authState?.user && authState?.business);
};

export const hasAdminRole = (authState?: AuthState): boolean => {
  return authState?.user?.role === "admin";
};
