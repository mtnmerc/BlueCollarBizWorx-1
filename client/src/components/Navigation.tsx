import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-user";
import { 
  Home, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  LogOut,
  Menu
} from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/jobs", label: "Jobs", icon: Briefcase },
    { path: "/estimates", label: "Estimates", icon: FileText },
    { path: "/invoices", label: "Invoices", icon: Receipt },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                BizWorx
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <Button
                    variant={location === path ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <Button
                    variant={location === path ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                </Link>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}