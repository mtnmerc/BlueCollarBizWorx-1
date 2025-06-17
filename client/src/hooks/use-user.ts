import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  businessId: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Business {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AuthResponse {
  user: User;
  business: Business;
}

async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return response.json();
}

export function useUser() {
  return useQuery<AuthResponse | null>({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('/api/user').catch(() => null),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => apiRequest('/api/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
    },
  });
}