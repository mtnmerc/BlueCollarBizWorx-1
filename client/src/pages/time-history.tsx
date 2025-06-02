import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";

type FilterType = 'day' | 'week' | 'payPeriod';

interface TimeEntry {
  id: number;
  clockIn: string;
  clockOut: string | null;
  totalHours: string | null;
  notes: string | null;
  userName?: string;
  userLastName?: string;
}

export default function TimeHistory() {
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');

  const { data: timeHistory = [], isLoading } = useQuery({
    queryKey: ['/api/time/history', filterType, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/time/history?filterType=${filterType}&date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch time history');
      return response.json();
    }
  });

  const { data: teamHistory = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/time/team-history', filterType, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/time/team-history?filterType=${filterType}&date=${selectedDate}`);
      if (!response.ok) {
        if (response.status === 403) return []; // Not admin
        throw new Error('Failed to fetch team history');
      }
      return response.json();
    }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/team'],
    queryFn: async () => {
      const response = await fetch('/api/team');
      return response.json();
    }
  });

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    let newDate: Date;

    if (filterType === 'day') {
      newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    } else if (filterType === 'week') {
      newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
    } else { // payPeriod
      newDate = direction === 'prev' ? subWeeks(currentDate, 2) : addWeeks(currentDate, 2);
    }

    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Get date range for display
  const getDateRangeDisplay = () => {
    const currentDate = new Date(selectedDate);
    if (filterType === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (filterType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else { // payPeriod
      const payStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const payEnd = addWeeks(payStart, 2);
      return `${format(payStart, 'MMM d')} - ${format(payEnd, 'MMM d, yyyy')}`;
    }
  };

  // Filter team history by selected member
  const filteredTeamHistory = selectedTeamMember === 'all' 
    ? teamHistory 
    : teamHistory.filter((entry: any) => entry.userId.toString() === selectedTeamMember);

  const formatHours = (hours: string | null) => {
    if (!hours) return '0.0';
    const numHours = parseFloat(hours);
    return numHours.toFixed(1);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getDateRange = () => {
    const date = new Date(selectedDate);
    switch (filterType) {
      case 'day':
        return formatDate(selectedDate);
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())}`;
      case 'payPeriod':
        const day = date.getDate();
        if (day <= 15) {
          const start = new Date(date.getFullYear(), date.getMonth(), 1);
          const end = new Date(date.getFullYear(), date.getMonth(), 15);
          return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
        } else {
          const start = new Date(date.getFullYear(), date.getMonth(), 16);
          const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
        }
    }
  };

  const calculateTotalHours = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => {
      const hours = entry.totalHours ? parseFloat(entry.totalHours) : 0;
      return total + hours;
    }, 0).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time History</h1>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">View By</label>
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
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
            
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              />
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-between py-3 px-4 bg-muted rounded-md">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous {filterType === 'day' ? 'Day' : filterType === 'week' ? 'Week' : 'Period'}
            </Button>
            
            <div className="text-center">
              <p className="font-medium text-sm">{getDateRangeDisplay()}</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateDate('next')}
            >
              Next {filterType === 'day' ? 'Day' : filterType === 'week' ? 'Week' : 'Period'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Team Member Filter (Admin Only) */}
          {teamHistory.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Users className="h-4 w-4" />
              <label className="text-sm font-medium">Filter by Team Member:</label>
              <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Hours ({calculateTotalHours(timeHistory)} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No time entries found for this period.
            </p>
          ) : (
            <div className="space-y-2">
              {timeHistory.map((entry: TimeEntry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatDate(entry.clockIn)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatHours(entry.totalHours)} hrs</p>
                    {!entry.clockOut && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Hours (Admin Only) */}
      {teamHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Hours ({calculateTotalHours(teamHistory)} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamHistory.map((entry: TimeEntry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {entry.userName} {entry.userLastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.clockIn)} • {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatHours(entry.totalHours)} hrs</p>
                    {!entry.clockOut && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}