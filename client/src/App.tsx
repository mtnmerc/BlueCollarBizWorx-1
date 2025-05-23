import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNavigation, BottomNavigation, FloatingActionButton } from "@/components/navigation";
import { AuthGuard } from "@/components/auth-guard";

// Pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Jobs from "@/pages/jobs";
import Invoices from "@/pages/invoices";
import Clients from "@/pages/clients";
import Team from "@/pages/team";
import TeamNew from "@/pages/team-new";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavigation />
      <main>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/clients" component={Clients} />
          <Route path="/team" component={Team} />
          <Route path="/team/new" component={TeamNew} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AuthGuard fallback={<Login />}>
          <AuthenticatedApp />
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
