import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Building, Upload, X, Camera, Key, Copy, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

const businessSettingsSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default function BusinessSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const business = (authData as any)?.business;

  const form = useForm<z.infer<typeof businessSettingsSchema>>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      name: business?.name || "",
      email: business?.email || "",
      phone: business?.phone || "",
      address: business?.address || "",
    },
  });

  // Update form when business data loads
  useState(() => {
    if (business) {
      form.reset({
        name: business.name || "",
        email: business.email || "",
        phone: business.phone || "",
        address: business.address || "",
      });
      if (business.logo) {
        setLogoPreview(business.logo);
      }
      if (business.apiKey) {
        setApiKey(business.apiKey);
      }
    }
  });

  const updateBusinessMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/business/settings", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update business settings",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (logoData: string) => apiRequest("PATCH", "/api/business/logo", { logo: logoData }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Create a canvas to compress the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

      setLogoPreview(compressedBase64);
      uploadLogoMutation.mutate(compressedBase64);
    };

    img.src = URL.createObjectURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    uploadLogoMutation.mutate("");
  };

  const generateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const response = await apiRequest("POST", "/api/business/api-key", {});
      const data = await response.json();
      if (data.success) {
        // Set the new API key immediately
        setApiKey(data.apiKey);
        setShowApiKey(true); // Show the key by default when newly generated
        toast({
          title: "Success",
          description: "API key generated successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate API key",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const revokeApiKey = async () => {
    try {
      await apiRequest("DELETE", "/api/business/api-key", {});
      setApiKey(null);
      toast({
        title: "Success",
        description: "API key revoked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof businessSettingsSchema>) => {
    updateBusinessMutation.mutate(values);
  };

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Business Settings</h1>
          </div>
        </div>

        {/* Logo Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-primary" />
              <span>Business Logo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Business Logo"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Building className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your business logo to display on invoices and estimates
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isUploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    {logoPreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={removeLogo}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: JPG, PNG. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>API Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate an API key to integrate your BizWorx data with external tools like n8n, Zapier, or custom applications.
              </p>

              {apiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyApiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={revokeApiKey}
                    >
                      Revoke Key
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No API key generated yet. Click below to create one.
                  </p>
                  <Button
                    type="button"
                    onClick={generateApiKey}
                    disabled={isGeneratingKey}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {isGeneratingKey ? "Generating..." : "Generate API Key"}
                  </Button>
                </div>
              )}

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">API Usage Instructions:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Include the API key in the <code>X-API-Key</code> header</li>
                  <li>• Base URL: <code>{window.location.origin}/api/external/</code></li>
                  <li>• <strong>Complete Endpoint Coverage:</strong></li>
                  <li>&nbsp;&nbsp;• Clients: GET, POST /clients</li>
                  <li>&nbsp;&nbsp;• Jobs: GET, POST, PUT, DELETE /jobs, /jobs/bulk, /jobs/calendar</li>
                  <li>&nbsp;&nbsp;• Invoices: GET, POST, PUT /invoices</li>
                  <li>&nbsp;&nbsp;• Estimates: GET, POST, PUT /estimates</li>
                  <li>&nbsp;&nbsp;• Users/Team: GET, POST /users</li>
                  <li>&nbsp;&nbsp;• Services: GET, POST /services</li>
                  <li>&nbsp;&nbsp;• Calendar: GET /schedule/available-slots</li>
                  <li>&nbsp;&nbsp;• Dashboard: GET /dashboard/stats</li>
                  <li>&nbsp;&nbsp;• Webhook: POST /webhook/n8n</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-primary" />
              <span>Business Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter business name" 
                          className="bg-background border-border text-foreground" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter business email" 
                          className="bg-background border-border text-foreground" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Phone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="Enter business phone" 
                          className="bg-background border-border text-foreground" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter business address" 
                          className="bg-background border-border text-foreground min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateBusinessMutation.isPending}
                  >
                    {updateBusinessMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">
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