import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Download, Settings } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, startOfDay } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');
  const [payPeriodType, setPayPeriodType] = useState<string>("weekly");
  const [payPeriodStartDay, setPayPeriodStartDay] = useState<number>(1);

  // Fetch current business settings for payroll config
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    onSuccess: (data: any) => {
      if (data.business) {
        setPayPeriodType(data.business.payPeriodType || "weekly");
        setPayPeriodStartDay(data.business.payPeriodStartDay || 1);
      }
    }
  });

  // Update pay period settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { payPeriodType: string; payPeriodStartDay: number }) => {
      const response = await apiRequest("PATCH", "/api/business/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Settings Updated",
        description: "Pay period settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update pay period settings. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  // Filter and sort team history by selected member
  const filteredTeamHistory = selectedTeamMember === 'all' 
    ? teamHistory 
    : teamHistory.filter((entry: any) => entry.userId.toString() === selectedTeamMember);

  // Sort team history by employee name, then by date for accounting reports
  const sortedTeamHistory = [...filteredTeamHistory].sort((a: any, b: any) => {
    // First sort by employee name (last name, then first name)
    const nameA = `${a.userLastName || ''} ${a.userName || ''}`.trim();
    const nameB = `${b.userLastName || ''} ${b.userName || ''}`.trim();
    const nameComparison = nameA.localeCompare(nameB);
    
    if (nameComparison !== 0) return nameComparison;
    
    // Then sort by date (newest first within each employee)
    return new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime();
  });

  // Generate CSV export for accounting
  const exportToCSV = () => {
    const headers = [
      'Employee Name',
      'Date',
      'Clock In',
      'Clock Out', 
      'Total Hours',
      'Notes',
      'Status'
    ];

    const csvData = sortedTeamHistory.map((entry: any) => [
      `${entry.userLastName || ''}, ${entry.userName || ''}`.trim(),
      formatDate(entry.clockIn),
      formatTime(entry.clockIn),
      entry.clockOut ? formatTime(entry.clockOut) : 'Not Clocked Out',
      entry.totalHours ? parseFloat(entry.totalHours).toFixed(2) : '0.00',
      entry.notes || '',
      entry.clockOut ? 'Complete' : 'Active'
    ]);

    // Add summary row
    const totalHours = calculateTotalHours(sortedTeamHistory);
    csvData.push(['', '', '', '', '', '', '']);
    csvData.push(['TOTAL HOURS:', '', '', '', totalHours, '', '']);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${getDateRangeDisplay().replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      payPeriodType,
      payPeriodStartDay,
    });
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNum];
  };

  const isAdmin = authData?.user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time History</h1>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Time History</TabsTrigger>
          {isAdmin && <TabsTrigger value="payroll">Payroll Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="history" className="space-y-6">

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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Hours ({calculateTotalHours(sortedTeamHistory)} total)
              </div>
              {sortedTeamHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedTeamHistory.map((entry: TimeEntry) => (
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
        </TabsContent>

        {/* Payroll Settings Tab */}
        {isAdmin && (
          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Pay Period Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pay Period Type */}
                  <div className="space-y-2">
                    <Label htmlFor="payPeriodType">Pay Period Schedule</Label>
                    <Select value={payPeriodType} onValueChange={setPayPeriodType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pay period schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {payPeriodType === "weekly" 
                        ? "Employee timesheets will be calculated weekly"
                        : "Employee timesheets will be calculated every two weeks"
                      }
                    </p>
                  </div>

                  {/* Pay Period Start Day */}
                  <div className="space-y-2">
                    <Label htmlFor="payPeriodStartDay">Pay Period Start Day</Label>
                    <Select value={payPeriodStartDay.toString()} onValueChange={(value) => setPayPeriodStartDay(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Pay periods will start on {getDayName(payPeriodStartDay)}
                    </p>
                  </div>
                </div>

                {/* Example Pay Period Display */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Example Pay Period</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    With your current settings, pay periods will run {payPeriodType === "weekly" ? "weekly" : "bi-weekly"} 
                    starting on {getDayName(payPeriodStartDay)}s. This affects how time history is grouped and 
                    how CSV exports are organized for payroll processing.
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="min-w-32"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}