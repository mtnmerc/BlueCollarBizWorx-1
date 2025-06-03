import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Clock, 
  Settings, 
  User, 
  Shield, 
  Phone, 
  Mail,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
  });

  const { data: teamMembers, isLoading: loadingTeam } = useQuery({
    queryKey: ["/api/team"],
  });

  const { data: timeStatus, isLoading: loadingTime } = useQuery({
    queryKey: ["/api/time/status"],
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
      toast({
        title: "Logged out",
        description: "You have been signed out successfully",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const clockInMutation = useMutation({
    mutationFn: () => fetch("/api/time/clock-in", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      queryClient.refetchQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Clocked In",
        description: "You have successfully clocked in",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clock In Failed",
        description: error.message || "Failed to clock in",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => fetch("/api/time/clock-out", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      queryClient.refetchQueries({ queryKey: ["/api/time/status"] });
      toast({
        title: "Clocked Out",
        description: "You have successfully clocked out",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clock Out Failed",
        description: error.message || "Failed to clock out",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = () => {
    clockInMutation.mutate();
  };

  const handleClockOut = () => {
    clockOutMutation.mutate();
  };

  const isAdmin = authData?.user?.role === "admin";

  if (loadingTeam || loadingTime) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const TeamMemberCard = ({ member }: { member: any }) => (
    <Card className="interactive-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {member.firstName?.[0]}{member.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {member.firstName} {member.lastName}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                  {member.role === "admin" ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Team Member
                    </>
                  )}
                </Badge>
                <Badge className="status-badge status-off-duty">
                  Off Duty
                </Badge>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mt-3 space-y-2">
          {member.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              {member.email}
            </div>
          )}
          {member.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              {member.phone}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            0 hours today
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Team & More</h1>
          {isAdmin && (
            <Button className="btn-primary" asChild>
              <a href="/team/new">
                <Plus className="h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="time">Time Clock</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            {teamMembers?.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member: any) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No team members</h3>
                  <p className="text-muted-foreground mb-4">Add team members to manage your workforce</p>
                  {isAdmin && (
                    <Button className="btn-primary" asChild>
                      <a href="/team/new">Add Team Member</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Time Clock Tab */}
          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold text-foreground">
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  
                  {timeStatus?.activeEntry ? (
                    <div className="space-y-4">
                      <Badge className="status-badge status-on-job">
                        Currently Clocked In
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Started at {new Date(timeStatus.activeEntry.clockIn).toLocaleTimeString()}
                      </p>
                      <Button 
                        className="btn-accent w-full"
                        onClick={handleClockOut}
                        disabled={clockOutMutation.isPending}
                      >
                        {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Badge className="status-badge status-off-duty">
                        Not Clocked In
                      </Badge>
                      <Button 
                        className="btn-primary w-full"
                        onClick={handleClockIn}
                        disabled={clockInMutation.isPending}
                      >
                        {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                      </Button>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Today's Hours: 0.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-3">
              {isAdmin && (
                <>
                  <Card className="interactive-card">
                    <CardContent className="p-4">
                      <Link href="/business-settings">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                              <Settings className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">Business Settings</h3>
                              <p className="text-sm text-muted-foreground">Manage business info and preferences</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="interactive-card">
                    <CardContent className="p-4">
                      <Link href="/team/new">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                              <Shield className="h-5 w-5 text-secondary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">User Management</h3>
                              <p className="text-sm text-muted-foreground">Add, edit, or remove team members</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card className="interactive-card">
                <CardContent className="p-4">
                  <Link href="/profile">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">My Profile</h3>
                          <p className="text-sm text-muted-foreground">Update your personal information</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card className="interactive-card" onClick={handleLogout}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Logout</h3>
                        <p className="text-sm text-muted-foreground">Sign out of your account</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
