import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  User,
  MapPin,
  Plus,
  Filter,
  FileText,
  MessageSquare,
  Phone,
  X,
  Edit3
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", 
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
};

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: team = [] } = useQuery({
    queryKey: ["/api/team"],
  });

  // Calendar navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get jobs for a specific date
  const getJobsForDate = (date: Date) => {
    return jobs.filter((job: any) => {
      if (!job.scheduledStart) return false;
      const jobDate = new Date(job.scheduledStart);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateForLoop = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateForLoop));
      currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
    }
    
    return days;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (viewMode === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const endOfWeek = new Date(date);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const JobCard = ({ job }: { job: any }) => {
    const client = clients.find((c: any) => c.id === job.clientId);
    const assignedUser = team.find((t: any) => t.id === job.assignedUserId);
    const startTime = job.scheduledStart ? new Date(job.scheduledStart).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : '';
    const endTime = job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : '';

    return (
      <div className="p-2 mb-1 rounded-md border border-border/50 bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer text-xs">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium truncate flex-1 mr-2">{job.title}</div>
          <div className="flex gap-1">
            <Badge variant="secondary" className={cn("text-xs px-1 py-0", PRIORITY_COLORS[job.priority as keyof typeof PRIORITY_COLORS])}>
              {job.priority}
            </Badge>
            <Badge variant="outline" className={cn("text-xs px-1 py-0", STATUS_COLORS[job.status as keyof typeof STATUS_COLORS])}>
              {job.status}
            </Badge>
          </div>
        </div>
        
        {(startTime || endTime) && (
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>{startTime}{endTime && ` - ${endTime}`}</span>
          </div>
        )}
        
        {client && (
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <User className="h-3 w-3" />
            <span className="truncate">{client.name}</span>
          </div>
        )}
        
        {assignedUser && (
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Avatar className="h-3 w-3">
              <AvatarFallback className="text-xs">{assignedUser.firstName?.[0] || assignedUser.username[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate">{assignedUser.firstName || assignedUser.username}</span>
          </div>
        )}
        
        {job.address && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{job.address}</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Job Calendar
          </h1>
          
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Link href="/jobs/new">
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Job
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayJobs = getJobsForDate(day);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "aspect-square p-2 border border-border/50 rounded-md cursor-pointer",
                      !isCurrentMonth && "opacity-40 bg-muted/20",
                      isToday && "ring-2 ring-primary",
                      "hover:bg-accent/50 transition-colors relative"
                    )}
                    onClick={() => {
                      if (dayJobs.length > 0) {
                        setSelectedDay(day);
                        setShowDayDetail(true);
                      }
                    }}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary font-bold"
                    )}>
                      {day.getDate()}
                    </div>
                    
                    {/* Job indicators */}
                    {dayJobs.length > 0 && (
                      <div className="space-y-1">
                        {dayJobs.length === 1 ? (
                          <div className="text-xs px-1 py-0.5 rounded bg-primary/20 text-primary font-medium truncate">
                            {dayJobs[0].title}
                          </div>
                        ) : (
                          <div className="text-xs px-1 py-0.5 rounded bg-primary text-primary-foreground font-medium text-center">
                            {dayJobs.length} jobs
                          </div>
                        )}
                        
                        {/* Priority indicators */}
                        {dayJobs.some((job: any) => job.priority === 'urgent') && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week/Day View */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground py-8">
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view coming soon!
              <br />
              <span className="text-sm">Switch to Month view to see your scheduled jobs</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getJobsForDate(new Date()).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return getJobsForDate(date).length;
              }).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter((job: any) => job.priority === 'urgent').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Day Detail Modal */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && selectedDay.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDay && getJobsForDate(selectedDay).map((job: any) => {
              const client = clients.find((c: any) => c.id === job.clientId);
              const assignedUser = team.find((t: any) => t.id === job.assignedUserId);
              const startTime = job.scheduledStart ? new Date(job.scheduledStart).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }) : '';
              const endTime = job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }) : '';

              return (
                <Card key={job.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className={cn("text-xs", PRIORITY_COLORS[job.priority as keyof typeof PRIORITY_COLORS])}>
                          {job.priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[job.status as keyof typeof STATUS_COLORS])}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {job.description && (
                      <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {(startTime || endTime) && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{startTime}{endTime && ` - ${endTime}`}</span>
                        </div>
                      )}
                      
                      {client && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{client.name}</span>
                        </div>
                      )}
                      
                      {assignedUser && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">{assignedUser.firstName?.[0] || assignedUser.username[0]}</AvatarFallback>
                          </Avatar>
                          <span>{assignedUser.firstName || assignedUser.username}</span>
                        </div>
                      )}
                      
                      {job.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(job.address)}`, '_blank')}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            {job.address}
                          </button>
                        </div>
                      )}
                      
                      {job.estimatedAmount && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Estimated:</span>
                          <span className="font-medium">${job.estimatedAmount}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    {job.status === "scheduled" && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="btn-primary flex-1"
                          onClick={() => window.location.href = `/invoices/new?fromJob=${job.id}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Draft Invoice
                        </Button>
                        {client?.phone && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`sms:${client.phone}?body=Hi ${client.name}, this is regarding your scheduled service: ${job.title}. We'll be arriving as scheduled. Thank you!`, '_self')}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`tel:${client.phone}`, '_self')}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}