import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Camera, User, MapPin, Phone, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function BusinessSettings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo: ""
  });

  // Fetch current business info
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    onSuccess: (data) => {
      if (data.business) {
        setBusinessData({
          name: data.business.name || "",
          email: data.business.email || "",
          phone: data.business.phone || "",
          address: data.business.address || "",
          logo: data.business.logo || ""
        });
      }
    }
  });

  // Update business info
  const updateBusinessMutation = useMutation({
    mutationFn: async (updates: Partial<typeof businessData>) => {
      const response = await apiRequest("PATCH", "/api/business/settings", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Business Updated",
        description: "Your business information has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upload logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (logo: string) => {
      const response = await apiRequest("PATCH", "/api/business/logo", { logo });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logo Updated",
        description: "Your business logo has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    const { logo, ...updates } = businessData;
    updateBusinessMutation.mutate(updates);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBusinessData(prev => ({ ...prev, logo: result }));
        uploadLogoMutation.mutate(result);
      };
      reader.readAsDataURL(file);
    }
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
        <Building2 className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Manage your business information and preferences</p>
        </div>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {businessData.logo ? (
                <img
                  src={businessData.logo}
                  alt="Business Logo"
                  className="w-20 h-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="business@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="businessPhone"
                value={businessData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </Label>
            <Textarea
              id="businessAddress"
              value={businessData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full business address"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveChanges}
              disabled={updateBusinessMutation.isPending}
              className="min-w-32"
            >
              {updateBusinessMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}