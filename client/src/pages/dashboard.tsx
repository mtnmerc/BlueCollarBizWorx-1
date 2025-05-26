import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Calculator, 
  CalendarPlus, 
  Clock, 
  Calendar,
  Route,
  MapPin,
  DollarSign,
  TrendingUp,
  Users2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/lib/auth";

interface DashboardStats {
  revenue: { total: number; count: number };
  todaysJobs: any[];
  recentInvoices: any[];
  teamMembers: any[];
}

export default function Dashboard() {
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!authData,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "paid": "status-paid",
      "pending": "status-pending", 
      "overdue": "status-overdue",
      "scheduled": "status-scheduled",
      "in_progress": "status-in-progress",
      "completed": "status-completed",
    };
    
    return (
      <Badge className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || ""}`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const quickActions = [
    {
      title: "New Invoice",
      description: "Create and send invoice",
      icon: FileText,
      color: "bg-accent",
      href: "/invoices/new",
    },
    {
      title: "New Estimate", 
      description: "Create job estimate",
      icon: Calculator,
      color: "bg-blue-500",
      href: "/estimates/new",
    },
    {
      title: "Schedule Job",
      description: "Add to calendar",
      icon: CalendarPlus,
      color: "bg-purple-500",
      href: "/jobs/new",
    },
    {
      title: "View Calendar",
      description: "See scheduled jobs",
      icon: Calendar,
      color: "bg-green-600",
      href: "/calendar",
    },
  ];

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4 space-y-6">
        <div className="gradient-primary rounded-2xl p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20">
      {/* Header Stats */}
      <div className="px-4 py-6 gradient-primary">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">
            Welcome back, {authData?.user?.firstName}
          </h2>
          <p className="text-green-100">{authData?.business?.name}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary-foreground">
                {formatCurrency(stats?.revenue?.total || 0)}
              </div>
              <div className="text-sm text-green-100">This Month</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary-foreground">
                {stats?.revenue?.count || 0}
              </div>
              <div className="text-sm text-green-100">Jobs Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="interactive-card h-auto p-4 text-left border-border bg-card hover:bg-muted/50"
              asChild
            >
              <a href={action.href}>
                <div>
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <action.icon className="text-white text-lg" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Today's Jobs */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Today's Jobs</h3>
          <Button variant="link" className="text-accent text-sm font-medium p-0">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {stats?.todaysJobs?.length ? (
            stats.todaysJobs.map((job) => (
              <Card key={job.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {job.client?.name || "Unknown Client"}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.address || "No address"}
                      </p>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {job.scheduledStart && job.scheduledEnd
                        ? `${formatTime(job.scheduledStart)} - ${formatTime(job.scheduledEnd)}`
                        : "Time TBD"}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{job.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-foreground">
                      {formatCurrency(parseFloat(job.estimatedAmount || "0"))}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="btn-primary">
                        <Route className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                      <Button variant="outline" size="sm" className="btn-accent">
                        {job.status === "scheduled" ? "Start Job" : "Complete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No jobs scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Invoices</h3>
          <Button variant="link" className="text-accent text-sm font-medium p-0">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {stats?.recentInvoices?.length ? (
            stats.recentInvoices.map((invoice) => (
              <Card key={invoice.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{invoice.invoiceNumber}</h4>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client?.name || "Unknown Client"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">
                        {formatCurrency(parseFloat(invoice.total))}
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{invoice.title}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No recent invoices</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Team Status */}
      <div className="px-4 py-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Team Status</h3>
        
        <div className="space-y-3">
          {stats?.teamMembers?.length ? (
            stats.teamMembers.map((member) => (
              <Card key={member.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {member.role === "admin" ? "Admin" : "Team Member"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="status-badge status-off-duty">
                        Off Duty
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">0 hrs today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <Users2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No team members</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
