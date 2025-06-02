import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Calendar, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function BusinessSettings() {
  const { toast } = useToast();
  const [payPeriodType, setPayPeriodType] = useState<string>("");
  const [payPeriodStartDay, setPayPeriodStartDay] = useState<number>(1);

  // Fetch current business settings
  const { data: business, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    onSuccess: (data) => {
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Configure your business preferences and payroll settings</p>
        </div>
      </div>

      {/* Pay Period Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
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
    </div>
  );
}