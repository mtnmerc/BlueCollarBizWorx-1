import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, MapPin, Clock, User, FileText, MessageSquare, Phone, X, Edit3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Jobs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest("PATCH", `/api/jobs/${jobId}`, {
        status: "cancelled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Cancelled",
        description: "The job has been successfully cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel the job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency", 
      currency: "USD",
    }).format(parseFloat(amount?.toString() || "0"));
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "scheduled": "status-scheduled",
      "in_progress": "status-in-progress", 
      "completed": "status-completed",
      "cancelled": "bg-red-500 text-white",
    };
    
    return (
      <Badge className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || ""}`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysJobs = jobs?.filter((job: any) => {
    if (!job.scheduledStart) return false;
    const jobDate = new Date(job.scheduledStart);
    jobDate.setHours(0, 0, 0, 0);
    return jobDate.getTime() === today.getTime();
  }) || [];

  const upcomingJobs = jobs?.filter((job: any) => {
    if (!job.scheduledStart) return false;
    const jobDate = new Date(job.scheduledStart);
    return jobDate > new Date();
  }) || [];

  const completedJobs = jobs?.filter((job: any) => job.status === "completed") || [];

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const JobCard = ({ job }: { job: any }) => {
    const handleCancelJob = () => {
      if (window.confirm("Are you sure you want to cancel this job?")) {
        cancelJobMutation.mutate(job.id);
      }
    };

    const handleRescheduleJob = () => {
      window.location.href = `/jobs/new?rescheduleJob=${job.id}`;
    };

    return (
      <Card key={job.id} className="interactive-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{job.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {job.client?.name || "Unknown Client"}
              </p>
              {job.address && (
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <button
                    onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(job.address)}`, '_blank')}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {job.address}
                  </button>
                </div>
              )}
            </div>
            {getStatusBadge(job.status)}
          </div>

          {job.scheduledStart && (
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {formatDateTime(job.scheduledStart)}
                {job.scheduledEnd && ` - ${formatDateTime(job.scheduledEnd)}`}
              </span>
            </div>
          )}

          {job.assignedUser && (
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <User className="h-4 w-4 mr-2" />
              <span>{job.assignedUser.firstName} {job.assignedUser.lastName}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(job.estimatedAmount || 0)}
            </span>
          </div>

          {/* Action buttons */}
          {job.status === "scheduled" && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="btn-primary flex-1"
                  onClick={() => window.location.href = `/invoices/new?fromJob=${job.id}`}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Draft Invoice
                </Button>
                {job.client?.phone && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`sms:${job.client.phone}?body=Hi ${job.client.name}, this is regarding your scheduled service: ${job.title}. We'll be arriving as scheduled. Thank you!`, '_self')}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`tel:${job.client.phone}`, '_self')}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleRescheduleJob}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Reschedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={handleCancelJob}
                  disabled={cancelJobMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  {cancelJobMutation.isPending ? "Cancelling..." : "Cancel"}
                </Button>
              </div>
            </div>
          )}

          {job.status === "in_progress" && (
            <Button variant="outline" size="sm" className="btn-primary w-full">
              Complete
            </Button>
          )}

          {job.status !== "scheduled" && job.status !== "in_progress" && (
            <Button variant="outline" size="sm" className="w-full">
              Details
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <Button className="btn-primary" asChild>
            <a href="/jobs/new">
              <Plus className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Job Tabs */}
      <div className="px-4 py-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today ({todaysJobs.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingJobs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {todaysJobs.length > 0 ? (
              todaysJobs.map((job: any) => <JobCard key={job.id} job={job} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No jobs today</h3>
                  <p className="text-muted-foreground">Your schedule is clear for today</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {upcomingJobs.length > 0 ? (
              upcomingJobs.map((job: any) => <JobCard key={job.id} job={job} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming jobs</h3>
                  <p className="text-muted-foreground mb-4">Schedule some jobs to fill your calendar</p>
                  <Button className="btn-primary" asChild>
                    <a href="/jobs/new">Schedule Job</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedJobs.length > 0 ? (
              completedJobs.map((job: any) => <JobCard key={job.id} job={job} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No completed jobs</h3>
                  <p className="text-muted-foreground">Completed jobs will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
