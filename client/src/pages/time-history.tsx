import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { authApi } from "@/lib/auth";

export default function TimeHistory() {
  const [filterType, setFilterType] = useState<'day' | 'week' | 'payPeriod'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team"],
  });

  const { data: timeHistory = [], isLoading } = useQuery({
    queryKey: ['/api/time/history', filterType, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/time/history?filterType=${filterType}&date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch time history');
      return response.json();
    }
  });

  const isAdmin = authData?.user?.role === 'admin';

  const getDateRangeDisplay = () => {
    const date = new Date(selectedDate);
    
    if (filterType === 'day') {
      return format(date, 'EEEE, MMMM d, yyyy');
    } else if (filterType === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(date, 'MMMM yyyy');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    
    if (filterType === 'day') {
      const newDate = direction === 'next' 
        ? new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      setSelectedDate(newDate.toISOString().split('T')[0]);
    } else if (filterType === 'week') {
      const newDate = direction === 'next' 
        ? addWeeks(currentDate, 1)
        : subWeeks(currentDate, 1);
      setSelectedDate(newDate.toISOString().split('T')[0]);
    }
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getStatusBadge = (entry: any) => {
    if (!entry.clockOut) {
      return <Badge className="status-badge status-on-job">Active</Badge>;
    }
    const hours = parseFloat(entry.totalHours || "0");
    if (hours >= 8) {
      return <Badge className="status-badge status-completed">Full Day</Badge>;
    } else if (hours >= 4) {
      return <Badge className="status-badge status-in-progress">Half Day</Badge>;
    } else {
      return <Badge className="status-badge status-pending">Short</Badge>;
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        filterType,
        date: selectedDate,
        ...(selectedUserId !== "all" && { userId: selectedUserId })
      });
      
      const response = await fetch(`/api/time/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-history-${filterType}-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Filter entries by selected user if admin has filtered
  const filteredHistory = selectedUserId === "all" 
    ? timeHistory 
    : timeHistory.filter((entry: any) => entry.userId === parseInt(selectedUserId));

  const totalHours = filteredHistory.reduce((sum: number, entry: any) => {
    return sum + parseFloat(entry.totalHours || "0");
  }, 0);

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Time History</h1>
          <p className="text-muted-foreground">View and manage time entries</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            {/* Filter Type and User Selection */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">View By</label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="payPeriod">Pay Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin User Filter */}
              {isAdmin && (
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Team Member</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      {teamMembers.map((member: any) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName} ({member.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-[200px] justify-center">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{getDateRangeDisplay()}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Hours: {formatDuration(totalHours)}</span>
                <span className="text-sm text-muted-foreground">
                  {filteredHistory.length} entries
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Time Entries</h3>
              <p className="text-muted-foreground">
                No time entries found for the selected period.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((entry: any) => (
            <Card key={entry.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {entry.userName} {entry.userLastName}
                        </h3>
                        {getStatusBadge(entry)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {format(new Date(entry.clockIn), 'MMM d, yyyy h:mm a')} - 
                          {entry.clockOut 
                            ? format(new Date(entry.clockOut), 'h:mm a')
                            : 'Still clocked in'
                          }
                        </p>
                        {entry.notes && (
                          <p className="italic">"{entry.notes}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {entry.totalHours ? formatDuration(parseFloat(entry.totalHours)) : 'Active'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.clockOut ? 'Completed' : 'In Progress'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}