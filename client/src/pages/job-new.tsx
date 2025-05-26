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

  // Get invoice ID from URL params if coming from invoice
  const urlParams = new URLSearchParams(window.location.search);
  const fromInvoiceId = urlParams.get("fromInvoice");

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

  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/jobs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Scheduled",
        description: "Job has been scheduled successfully.",
      });
      window.location.href = "/jobs";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    createJobMutation.mutate({
      clientId: parseInt(values.clientId),
      title: values.title,
      description: values.description,
      scheduledDate: values.scheduledDate,
      estimatedHours: parseInt(values.estimatedHours),
      status: "scheduled",
    });
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
              <h1 className="text-2xl font-bold text-foreground">Schedule Job</h1>
              <p className="text-muted-foreground">Schedule a new job for your client</p>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    className="flex-1 gradient-primary"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? "Scheduling..." : "Schedule Job"}
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