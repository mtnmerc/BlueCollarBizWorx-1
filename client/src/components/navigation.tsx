import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  FileText, 
  Users, 
  MoreHorizontal, 
  Bell, 
  UserCircle, 
  Plus,
  Settings,
  Wrench,
  LogOut,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function TopNavigation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
      toast({
        title: "Logged out",
        description: "You have been signed out successfully",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Wrench className="text-primary-foreground text-sm" />
          </div>
          <h1 className="text-xl font-bold text-foreground">BizWorx</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/jobs", icon: Calendar, label: "Jobs" },
    { path: "/estimates", icon: FileText, label: "Estimates" },
    { path: "/invoices", icon: FileText, label: "Invoices" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/services", icon: Package, label: "Services" },
    { path: "/team", icon: Users, label: "Team" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="grid grid-cols-7 h-16">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={`nav-item ${
                location === item.path ? "active" : ""
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function FloatingActionButton() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {showMenu && (
        <div className="absolute bottom-16 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <Link href="/invoices/new">
            <div className="px-4 py-3 hover:bg-muted text-sm flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>New Invoice</span>
            </div>
          </Link>
          <Link href="/estimates/new">
            <div className="px-4 py-3 hover:bg-muted text-sm flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>New Estimate</span>
            </div>
          </Link>
          <Link href="/jobs/new">
            <div className="px-4 py-3 hover:bg-muted text-sm flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule Job</span>
            </div>
          </Link>
          <Link href="/clients/new">
            <div className="px-4 py-3 hover:bg-muted text-sm flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Add Client</span>
            </div>
          </Link>
        </div>
      )}
      <Button
        size="lg"
        className="w-14 h-14 gradient-accent rounded-full shadow-lg"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Plus className="h-6 w-6 text-accent-foreground" />
      </Button>
    </div>
  );
}
