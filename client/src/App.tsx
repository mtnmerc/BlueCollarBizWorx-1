import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Clients from "@/pages/Clients";
import Jobs from "@/pages/Jobs";
import Estimates from "@/pages/Estimates";
import Invoices from "@/pages/Invoices";
import Navigation from "@/components/Navigation";
import { useUser } from "@/hooks/use-user";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/estimates" component={Estimates} />
          <Route path="/invoices" component={Invoices} />
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bizworx-theme">
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}