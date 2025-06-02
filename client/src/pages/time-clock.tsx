import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "wouter";

export default function TimeClock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: timeStatus } = useQuery({
    queryKey: ["/api/time/status"],
  });

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

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Time Clock</h1>
              <p className="text-muted-foreground">Track your work hours</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="text-4xl font-bold text-foreground">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div className="text-muted-foreground">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              
              {timeStatus?.activeEntry ? (
                <div className="space-y-4">
                  <Badge className="status-badge status-on-job text-lg px-4 py-2">
                    Currently Clocked In
                  </Badge>
                  <p className="text-muted-foreground">
                    Started at {new Date(timeStatus.activeEntry.clockIn).toLocaleTimeString()}
                  </p>
                  <Button 
                    size="lg"
                    className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleClockOut}
                    disabled={clockOutMutation.isPending}
                  >
                    {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge className="status-badge status-off-duty text-lg px-4 py-2">
                    Not Clocked In
                  </Badge>
                  <Button 
                    size="lg"
                    className="w-full h-16 text-lg gradient-primary"
                    onClick={handleClockIn}
                    disabled={clockInMutation.isPending}
                  >
                    {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                  </Button>
                </div>
              )}
              
              <div className="pt-6 border-t border-border">
                <p className="text-muted-foreground">
                  Today's Hours: {timeStatus?.todayHours?.toFixed(1) || '0.0'}
                </p>
                {timeStatus?.activeEntry && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently working: {Math.floor((Date.now() - new Date(timeStatus.activeEntry.clockIn).getTime()) / (1000 * 60))} minutes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}