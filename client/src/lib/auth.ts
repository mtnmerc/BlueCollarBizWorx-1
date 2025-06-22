import { apiRequest } from "./queryClient";
import { auth } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";

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
  firebaseUser?: FirebaseUser;
}

export const authApi = {
  async registerBusiness(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) {
    // First create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Then register business with Firebase UID
    const response = await apiRequest("POST", "/api/auth/business/register", {
      ...data,
      firebaseUid: userCredential.user.uid
    });
    return response.json();
  },

  async loginBusiness(data: { email: string; password: string }) {
    // First authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    
    // Then login business with Firebase UID
    const response = await apiRequest("POST", "/api/auth/business/login", {
      ...data,
      firebaseUid: userCredential.user.uid
    });
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
    // Sign out from Firebase
    await signOut(auth);
    
    // Then logout from backend
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  async getMe() {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  // Firebase Auth state listener
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current Firebase user
  getCurrentFirebaseUser() {
    return auth.currentUser;
  },
};

export const isAuthenticated = (authState?: AuthState): boolean => {
  return !!(authState?.user && authState?.business && authState?.firebaseUser);
};

export const hasAdminRole = (authState?: AuthState): boolean => {
  return authState?.user?.role === "admin";
};
