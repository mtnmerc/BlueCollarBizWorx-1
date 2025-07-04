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
import Profile from "@/pages/profile";
import BusinessSetupComplete from "@/pages/business-setup-complete";
import InvoiceNew from "@/pages/invoice-new";
import ClientNew from "@/pages/client-new";
import ClientDetail from "@/pages/client-detail";
import ClientEdit from "@/pages/client-edit";
import Services from "@/pages/services";
import ServiceNew from "@/pages/service-new";
import ServiceEdit from "@/pages/service-edit";
import JobNew from "@/pages/job-new";
import EstimateNew from "@/pages/estimate-new";
import Estimates from "@/pages/estimates";
import EstimateDetail from "@/pages/estimate-detail";
import EstimateEdit from "@/pages/estimate-edit";
import InvoiceDetail from "@/pages/invoice-detail";
import InvoiceEdit from "@/pages/invoice-edit";
import BusinessSettings from "@/pages/business-settings";
import PublicEstimate from "@/pages/public-estimate";
import PublicInvoice from "@/pages/public-invoice";
import TimeClock from "@/pages/time-clock";
import Calendar from "@/pages/calendar";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavigation />
      <main>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/jobs/new" component={JobNew} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/invoices/new" component={InvoiceNew} />
          <Route path="/estimates" component={Estimates} />
          <Route path="/estimates/new" component={EstimateNew} />
          <Route path="/estimates/:id" component={EstimateDetail} />
          <Route path="/estimates/:id/edit" component={EstimateEdit} />
          <Route path="/invoices/:id" component={InvoiceDetail} />
          <Route path="/invoices/:id/edit" component={InvoiceEdit} />
          <Route path="/clients" component={Clients} />
          <Route path="/clients/new" component={ClientNew} />
          <Route path="/clients/:id" component={ClientDetail} />
          <Route path="/clients/:id/edit" component={ClientEdit} />
          <Route path="/services" component={Services} />
          <Route path="/services/new" component={ServiceNew} />
          <Route path="/services/:id/edit" component={ServiceEdit} />
          <Route path="/team" component={Team} />
          <Route path="/team/new" component={TeamNew} />
          <Route path="/profile" component={Profile} />
          <Route path="/business-settings" component={BusinessSettings} />
          <Route path="/time-clock" component={TimeClock} />
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
      <Route path="/setup" component={BusinessSetupComplete} />
      <Route path="/estimate/:shareToken" component={PublicEstimate} />
      <Route path="/invoice/:shareToken" component={PublicInvoice} />
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
