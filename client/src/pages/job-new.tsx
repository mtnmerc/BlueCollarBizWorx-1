import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link } from "wouter";

const jobSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  assignedUserId: z.string().optional(),
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  estimatedAmount: z.string().min(1, "Estimated amount is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  jobType: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringFrequency: z.enum(["weekly", "monthly", "quarterly"]).optional(),
  recurringEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function JobNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const fromInvoiceId = urlParams.get("fromInvoice");
  const rescheduleJobId = urlParams.get("rescheduleJob");

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      clientId: "",
      assignedUserId: "",
      title: "",
      description: "",
      address: "",
      scheduledDate: "",
      startTime: "09:00",
      endTime: "17:00",
      estimatedAmount: "",
      priority: "normal",
      jobType: "",
      recurring: false,
      recurringFrequency: "weekly",
      recurringEndDate: "",
      notes: "",
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team"],
  });

  // Fetch invoice data if creating job from invoice
  const { data: invoice } = useQuery({
    queryKey: [`/api/invoices/${fromInvoiceId}`],
    enabled: !!fromInvoiceId,
  });

  // Fetch existing job data if rescheduling
  const { data: existingJob } = useQuery({
    queryKey: [`/api/jobs/${rescheduleJobId}`],
    enabled: !!rescheduleJobId,
  });

  // Auto-populate form when invoice data loads
  useEffect(() => {
    if (invoice && fromInvoiceId) {
      form.setValue("clientId", (invoice as any).clientId?.toString() || "");
      form.setValue("title", (invoice as any).title || "");
      form.setValue("description", (invoice as any).description || "");
      form.setValue("estimatedAmount", (invoice as any).total?.toString() || "");
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      form.setValue("scheduledDate", tomorrow.toISOString().split('T')[0]);
    }
  }, [invoice, fromInvoiceId, form]);

  // Auto-populate form when existing job data loads for rescheduling
  useEffect(() => {
    if (existingJob && rescheduleJobId && clients && teamMembers) {
      const job = existingJob as any;
      
      // Only set values if clients and team data are loaded
      form.setValue("clientId", job.clientId?.toString() || "");
      form.setValue("assignedUserId", job.assignedUserId?.toString() || "");
      form.setValue("title", job.title || "");
      form.setValue("description", job.description || "");
      form.setValue("address", job.address || "");
      form.setValue("estimatedAmount", job.estimatedAmount?.toString() || "");
      form.setValue("priority", job.priority || "normal");
      form.setValue("jobType", job.jobType || "");
      form.setValue("notes", job.notes || "");
      
      // Parse existing scheduled date and time
      if (job.scheduledStart) {
        const startDate = new Date(job.scheduledStart);
        form.setValue("scheduledDate", startDate.toISOString().split('T')[0]);
        form.setValue("startTime", startDate.toTimeString().slice(0, 5));
      }
      
      if (job.scheduledEnd) {
        const endDate = new Date(job.scheduledEnd);
        form.setValue("endTime", endDate.toTimeString().slice(0, 5));
      }
      
      // Handle recurring fields
      if (job.isRecurring) {
        form.setValue("recurring", true);
        form.setValue("recurringFrequency", job.recurringFrequency);
        if (job.recurringEndDate) {
          form.setValue("recurringEndDate", new Date(job.recurringEndDate).toISOString().split('T')[0]);
        }
      }
    }
  }, [existingJob, rescheduleJobId, clients, teamMembers, form]);

  // Auto-fill client information when client is selected
  const handleClientChange = (clientId: string) => {
    form.setValue("clientId", clientId);
    
    if (clients && clientId) {
      const selectedClient = (clients as any[]).find(client => client.id.toString() === clientId);
      if (selectedClient) {
        // Auto-fill address if client has one and current address is empty
        if (selectedClient.address && !form.getValues("address")) {
          form.setValue("address", selectedClient.address);
        }
      }
    }
  };

  const createJobMutation = useMutation({
    mutationFn: (data: any) => {
      if (rescheduleJobId) {
        return apiRequest("PATCH", `/api/jobs/${rescheduleJobId}`, data);
      } else {
        return apiRequest("POST", "/api/jobs", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: rescheduleJobId ? "Job Rescheduled" : "Job Scheduled",
        description: rescheduleJobId ? "Job has been rescheduled successfully." : "Job has been scheduled successfully.",
      });
      window.location.href = "/jobs";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (rescheduleJobId ? "Failed to reschedule job" : "Failed to schedule job"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    const submitData = {
      clientId: parseInt(values.clientId),
      assignedUserId: values.assignedUserId ? parseInt(values.assignedUserId) : null,
      title: values.title,
      description: values.description,
      address: values.address,
      scheduledStart: new Date(`${values.scheduledDate}T${values.startTime}`).toISOString(),
      scheduledEnd: new Date(`${values.scheduledDate}T${values.endTime}`).toISOString(),
      estimatedAmount: values.estimatedAmount ? parseFloat(values.estimatedAmount) : null,
      priority: values.priority,
      jobType: values.jobType || null,
      notes: values.notes || null,
      isRecurring: values.recurring || false,
      recurringFrequency: values.recurring ? values.recurringFrequency : null,
      recurringEndDate: values.recurringEndDate ? new Date(values.recurringEndDate).toISOString() : null,
      status: "scheduled",
    };

    createJobMutation.mutate(submitData);
  };

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {rescheduleJobId ? "Reschedule Job" : "Schedule Job"}
              </h1>
              <p className="text-muted-foreground">
                {rescheduleJobId ? "Update the schedule for this job" : "Schedule a new job for your client"}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={handleClientChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(clients) && clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the work to be done..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Team Member</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(teamMembers as any)?.map((member: any) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.firstName} {member.lastName} ({member.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="500.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Maintenance, Installation, Repair" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes for this job..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurring Job Options */}
                <div className="border rounded-lg p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Recurring Job</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Schedule this job to repeat automatically
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("recurring") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recurringFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurringEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    className="flex-1 gradient-primary"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending 
                      ? (rescheduleJobId ? "Rescheduling..." : "Scheduling...") 
                      : (rescheduleJobId ? "Reschedule Job" : "Schedule Job")
                    }
                  </Button>
                  <Link href="/jobs">
                    <Button variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}