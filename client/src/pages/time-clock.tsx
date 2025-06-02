import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Download, Edit2, Settings, Users } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function TimeClock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("clock");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch time status for current user
  const { data: timeStatus } = useQuery({
    queryKey: ["/api/time/status"],
  });

  // Fetch team members for admin payroll view
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/users"],
    enabled: activeTab === "payroll"
  });

  // Fetch payroll data
  const { data: payrollData } = useQuery({
    queryKey: ["/api/time/payroll", selectedUserId, selectedDateRange.start, selectedDateRange.end],
    enabled: activeTab === "payroll"
  });

  // Fetch payroll settings
  const { data: payrollSettings } = useQuery({
    queryKey: ["/api/payroll/settings"],
    enabled: activeTab === "settings"
  });

  // Clock mutations
  const clockInMutation = useMutation({
    mutationFn: () => fetch("/api/time/clock-in", { method: "POST", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Clocked In",
        description: "Successfully clocked in for your shift.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => fetch("/api/time/clock-out", { method: "POST", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Clocked Out",
        description: "Successfully clocked out of your shift.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const breakStartMutation = useMutation({
    mutationFn: () => fetch("/api/time/break-start", { method: "POST", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Break Started",
        description: "Your break has been started.",
      });
    },
  });

  const breakEndMutation = useMutation({
    mutationFn: () => fetch("/api/time/break-end", { method: "POST", credentials: "include" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Break Ended",
        description: "Your break has been ended.",
      });
    },
  });

  // Update time entry mutation
  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({ id, totalHours }: { id: number; totalHours: string }) => {
      const response = await apiRequest("PUT", `/api/time/entries/${id}`, { totalHours });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/payroll"] });
      toast({
        title: "Updated",
        description: "Time entry updated successfully.",
      });
    },
  });

  // Export payroll mutation
  const exportPayrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/time/export?${new URLSearchParams({
        userId: selectedUserId,
        startDate: selectedDateRange.start,
        endDate: selectedDateRange.end
      })}`);
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${selectedDateRange.start}-${selectedDateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Exported",
        description: "Payroll data exported successfully.",
      });
    },
  });

  // Update payroll settings mutation
  const updatePayrollSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/payroll/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/settings"] });
      toast({
        title: "Updated",
        description: "Payroll settings updated successfully.",
      });
    },
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Time Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clock" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Clock
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Time Clock Tab */}
        <TabsContent value="clock">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="text-6xl font-mono font-bold text-primary mb-2">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-2xl font-mono text-muted-foreground">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour12: false,
                      second: '2-digit'
                    }).split(':')[2]}
                  </div>
                  <p className="text-center text-muted-foreground mt-2">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="space-y-4">
                  {timeStatus?.activeEntry ? (
                    <div className="space-y-4">
                      <Badge className="status-badge status-on-job text-lg px-4 py-2">
                        Currently Clocked In
                      </Badge>
                      <p className="text-muted-foreground">
                        Started at {new Date(timeStatus.activeEntry.clockIn).toLocaleTimeString()}
                      </p>
                      
                      <div className="flex flex-col gap-3">
                        {!timeStatus.activeEntry.breakStart ? (
                          <Button 
                            onClick={() => breakStartMutation.mutate()}
                            disabled={breakStartMutation.isPending}
                            variant="outline"
                            size="lg"
                            className="w-full"
                          >
                            Start Break
                          </Button>
                        ) : !timeStatus.activeEntry.breakEnd ? (
                          <Button 
                            onClick={() => breakEndMutation.mutate()}
                            disabled={breakEndMutation.isPending}
                            variant="outline"
                            size="lg"
                            className="w-full"
                          >
                            End Break
                          </Button>
                        ) : null}
                        
                        <Button 
                          onClick={() => clockOutMutation.mutate()}
                          disabled={clockOutMutation.isPending}
                          variant="destructive"
                          size="lg"
                          className="w-full"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Clock Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        Not Clocked In
                      </Badge>
                      <Button 
                        onClick={() => clockInMutation.mutate()}
                        disabled={clockInMutation.isPending}
                        size="lg"
                        className="w-full"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Clock In
                      </Button>
                    </div>
                  )}
                  
                  <div className="pt-6 border-t border-border">
                    <p className="text-muted-foreground">
                      Today's Hours: {timeStatus?.todayHours?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Hours & Payroll
                <Button 
                  onClick={() => exportPayrollMutation.mutate()}
                  disabled={exportPayrollMutation.isPending}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="team-member">Team Member</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All team members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All team members</SelectItem>
                      {teamMembers?.map((member: any) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    type="date"
                    value={selectedDateRange.start}
                    onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    type="date"
                    value={selectedDateRange.end}
                    onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Break Duration</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.user?.firstName} {entry.user?.lastName}</TableCell>
                        <TableCell>{new Date(entry.clockIn).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(entry.clockIn).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : "Active"}
                        </TableCell>
                        <TableCell>
                          {entry.breakStart && entry.breakEnd 
                            ? Math.round((new Date(entry.breakEnd).getTime() - new Date(entry.breakStart).getTime()) / (1000 * 60)) + " min"
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={entry.totalHours || ""}
                            onChange={(e) => {
                              // Update local state or handle optimistically
                            }}
                            onBlur={(e) => {
                              if (e.target.value !== entry.totalHours) {
                                updateTimeEntryMutation.mutate({
                                  id: entry.id,
                                  totalHours: e.target.value
                                });
                              }
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay-period">Pay Period Type</Label>
                  <Select 
                    value={payrollSettings?.payPeriodType || "weekly"}
                    onValueChange={(value) => {
                      updatePayrollSettingsMutation.mutate({
                        payPeriodType: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-day">Pay Period Start Day</Label>
                  <Select 
                    value={payrollSettings?.payPeriodStartDay?.toString() || "1"}
                    onValueChange={(value) => {
                      updatePayrollSettingsMutation.mutate({
                        payPeriodStartDay: parseInt(value)
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="overtime-threshold">Overtime Threshold (hours)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={payrollSettings?.overtimeThreshold || 40}
                    onChange={(e) => {
                      updatePayrollSettingsMutation.mutate({
                        overtimeThreshold: parseFloat(e.target.value)
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="overtime-multiplier">Overtime Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={payrollSettings?.overtimeMultiplier || 1.5}
                    onChange={(e) => {
                      updatePayrollSettingsMutation.mutate({
                        overtimeMultiplier: parseFloat(e.target.value)
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}