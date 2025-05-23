import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Building, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const setupSteps = [
  { id: 1, title: "Business Information", description: "Tell us about your business" },
  { id: 2, title: "Account Created", description: "Welcome to BizWorx!" },
];

export default function BusinessSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.registerBusiness,
    onSuccess: (data) => {
      setCurrentStep(2);
      toast({
        title: "Success!",
        description: "Your business has been registered successfully",
      });
      
      // Auto-redirect to dashboard after a moment
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register your business. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  const progressPercentage = (currentStep / setupSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to BizWorx</h1>
            <p className="text-muted-foreground">Let's set up your business account</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {currentStep} of {setupSteps.length}</span>
            <span className="text-accent font-medium">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="space-y-2">
            {setupSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  step.id < currentStep 
                    ? "text-accent bg-accent/10" 
                    : step.id === currentStep 
                    ? "text-foreground bg-muted/50" 
                    : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step.id < currentStep 
                    ? "bg-accent text-accent-foreground" 
                    : step.id === currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step.id < currentStep ? <Check className="h-3 w-3" /> : step.id}
                </div>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-accent" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Johnson's Plumbing & Repair" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="mike@johnsonsplumbing.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Minimum 6 characters" />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St, City, State 12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Create Business Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
              <p className="text-muted-foreground mb-6">
                Welcome to BizWorx! Your business account has been successfully created. 
                You're now ready to start managing your blue-collar business.
              </p>
              
              <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground">What's Next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span>Add your first client</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span>Create your services and pricing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span>Schedule your first job</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span>Invite team members</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Redirecting to dashboard in a moment...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alternative Login Link */}
        {currentStep === 1 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have a business account?{" "}
              <a href="/login" className="text-accent hover:underline font-medium">
                Sign in here
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
