import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import BusinessSetup from "@/pages/business-setup";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if we're in setup mode (business created but admin PIN not set)
  if (authData?.setupMode && authData?.business) {
    return <BusinessSetup />;
  }

  if (error || !authData?.user || !authData?.business) {
    return fallback || null;
  }

  return <>{children}</>;
}
