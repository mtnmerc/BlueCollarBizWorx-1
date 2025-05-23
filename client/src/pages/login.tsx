import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Building, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";

const businessLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const userLoginSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits"),
});

const businessRegisterSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default function Login() {
  const [step, setStep] = useState<"business" | "user">("business");
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const businessForm = useForm({
    resolver: zodResolver(isRegister ? businessRegisterSchema : businessLoginSchema),
    defaultValues: isRegister ? {
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    } : {
      email: "",
      password: "",
    },
  });

  const userForm = useForm({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      pin: "",
    },
  });

  const businessMutation = useMutation({
    mutationFn: isRegister ? authApi.registerBusiness : authApi.loginBusiness,
    onSuccess: (data) => {
      if (isRegister) {
        // Auto-login admin user after registration
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        window.location.href = "/";
      } else {
        setStep("user");
      }
      toast({
        title: "Success",
        description: isRegister ? "Business registered successfully" : "Business login successful",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    },
  });

  const userMutation = useMutation({
    mutationFn: authApi.loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid PIN",
        description: "Please check your PIN and try again",
        variant: "destructive",
      });
    },
  });

  const onBusinessSubmit = (data: any) => {
    businessMutation.mutate(data);
  };

  const onUserSubmit = (data: any) => {
    userMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">BizWorx</h1>
            <p className="text-muted-foreground">Blue-Collar Business Management</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step === "business" ? "text-accent" : "text-muted-foreground"}`}>
            <Building className="h-5 w-5" />
            <span className="text-sm font-medium">Business</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${step === "user" ? "text-accent" : "text-muted-foreground"}`}>
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Team Login</span>
          </div>
        </div>

        {/* Business Login/Register */}
        {step === "business" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isRegister ? "Register Your Business" : "Business Login"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
                  {isRegister && (
                    <FormField
                      control={businessForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Johnson's Plumbing & Repair" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={businessForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="mike@johnsonsplumbing.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isRegister && (
                    <>
                      <FormField
                        control={businessForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 123-4567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main St, City, State" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={businessMutation.isPending}
                  >
                    {businessMutation.isPending ? "Please wait..." : isRegister ? "Register Business" : "Continue"}
                  </Button>
                </form>
              </Form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-accent"
                >
                  {isRegister ? "Already have a business? Sign in" : "New business? Register here"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User PIN Login */}
        {step === "user" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Team Member Login</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter Your PIN</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••"
                            maxLength={4}
                            className="text-center text-2xl tracking-widest"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={userMutation.isPending}
                  >
                    {userMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setStep("business")}
                  className="text-muted-foreground"
                >
                  ← Back to Business Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
