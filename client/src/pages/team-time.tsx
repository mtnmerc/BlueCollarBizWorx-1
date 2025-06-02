import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Edit, Users } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface TimeEntry {
  id: number;
  userId: number;
  userName: string;
  userLastName: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
  notes: string | null;
}

interface TeamHoursSummary {
  userId: number;
  userName: string;
  userLastName: string;
  totalHours: number;
}

export default function TeamTime() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
    notes: ''
  });

  // Get team hours summary for selected date
  const { data: teamSummary } = useQuery({
    queryKey: ["/api/time/team-hours", selectedDate],
    queryFn: () => fetch(`/api/time/team-hours?startDate=${selectedDate}&endDate=${selectedDate}`).then(res => res.json())
  });

  // Get detailed time entries for selected date
  const { data: timeEntries } = useQuery({
    queryKey: ["/api/time/entries", selectedDate],
    queryFn: () => fetch(`/api/time/entries?startDate=${selectedDate}&endDate=${selectedDate}`).then(res => res.json())
  });

  const updateEntryMutation = useMutation({
    mutationFn: (data: { id: number; clockIn?: string; clockOut?: string; notes?: string }) =>
      apiRequest("PUT", `/api/time/entries/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/team-hours"] });
      setEditingEntry(null);
      toast({
        title: "Time Entry Updated",
        description: "The time entry has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update time entry",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditForm({
      clockIn: entry.clockIn ? new Date(entry.clockIn).toISOString().slice(0, 16) : '',
      clockOut: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '',
      notes: entry.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;

    const clockInTime = new Date(editForm.clockIn);
    const clockOutTime = editForm.clockOut ? new Date(editForm.clockOut) : null;
    
    let totalHours = null;
    if (clockOutTime) {
      totalHours = Math.round(((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)) * 4) / 4;
    }

    updateEntryMutation.mutate({
      id: editingEntry.id,
      clockIn: editForm.clockIn,
      clockOut: editForm.clockOut || undefined,
      notes: editForm.notes,
      totalHours
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/team">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Time Management</h1>
              <p className="text-muted-foreground">View and manage team member hours</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="date">Select Date</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-fit"
          />
        </div>

        {/* Team Hours Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Daily Summary - {new Date(selectedDate).toLocaleDateString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamSummary && teamSummary.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamSummary.map((member: TeamHoursSummary) => (
                  <div key={member.userId} className="p-4 border rounded-lg">
                    <div className="font-semibold">
                      {member.userName} {member.userLastName}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatDuration(member.totalHours)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No time entries for this date</p>
            )}
          </CardContent>
        </Card>

        {/* Detailed Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries && timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries.map((entry: TimeEntry) => (
                  <div key={entry.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {entry.userName} {entry.userLastName}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            Clock In: {formatTime(entry.clockIn)}
                            {entry.clockOut && (
                              <span> → Clock Out: {formatTime(entry.clockOut)}</span>
                            )}
                          </div>
                          {entry.totalHours && (
                            <div>Duration: {formatDuration(entry.totalHours)}</div>
                          )}
                          {entry.notes && (
                            <div>Notes: {entry.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!entry.clockOut && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Edit Time Entry - {entry.userName} {entry.userLastName}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="clockIn">Clock In</Label>
                                <Input
                                  id="clockIn"
                                  type="datetime-local"
                                  value={editForm.clockIn}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, clockIn: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="clockOut">Clock Out</Label>
                                <Input
                                  id="clockOut"
                                  type="datetime-local"
                                  value={editForm.clockOut}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, clockOut: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                  id="notes"
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Optional notes"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleSaveEdit}
                                  disabled={updateEntryMutation.isPending}
                                >
                                  {updateEntryMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No time entries for this date</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}