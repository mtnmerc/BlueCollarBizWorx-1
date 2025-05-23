import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const teamMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
  role: z.enum(["admin", "member"]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export default function TeamNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      pin: "",
      role: "member" as const,
      email: "",
      phone: "",
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/team", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: "Success!",
        description: "Team member has been added successfully",
      });
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Clean up empty email field
    if (data.email === "") {
      delete data.email;
    }
    createMemberMutation.mutate(data);
  };

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Add Team Member</h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-accent" />
              <span>Team Member Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Smith" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="johnsmith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4-Digit PIN *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="1234" 
                          maxLength={4}
                          className="text-center text-lg tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        This PIN will be used for clocking in/out and accessing the app
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Team Member</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Admin</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={createMemberMutation.isPending}
                  >
                    {createMemberMutation.isPending ? "Adding Team Member..." : "Add Team Member"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Team Member Access</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <span className="font-medium">Team Members</span> can clock in/out, view assigned jobs, and create invoices
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <span className="font-medium">Admins</span> have full access including team management and business settings
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}