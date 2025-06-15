import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, DollarSign, Package, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Services() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Service Deleted",
        description: "Service has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
  });

  const filteredServices = services?.filter((service: any) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "services") return matchesSearch && service.unit === "hour";
    if (activeTab === "products") return matchesSearch && service.unit === "item";
    if (activeTab === "materials") return matchesSearch && (service.unit === "sq_ft" || service.unit === "yard" || service.unit === "pound");
    return matchesSearch;
  }) || [];

  const getServiceIcon = (unit: string) => {
    if (unit === "hour") return <Wrench className="h-4 w-4" />;
    if (unit === "item") return <Package className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getServiceType = (unit: string) => {
    if (unit === "hour") return "Service";
    if (unit === "item") return "Product";
    return "Material";
  };

  const getUnitDisplay = (unit: string) => {
    const unitMap: { [key: string]: string } = {
      hour: "per hour",
      item: "per item", 
      sq_ft: "per sq ft",
      yard: "per yard",
      pound: "per lb",
      gallon: "per gallon"
    };
    return unitMap[unit] || `per ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-12 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Services & Products</h1>
          <Link href="/services/new">
            <Button className="btn-primary">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services, products, materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Services List */}
      <div className="px-4 py-6">
        {filteredServices.length > 0 ? (
          <div className="space-y-3">
            {filteredServices.map((service: any) => (
              <Card key={service.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        {getServiceIcon(service.unit)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getServiceType(service.unit)}
                          </Badge>
                          {!service.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {service.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                            <span className="font-semibold text-foreground">
                              ${parseFloat(service.rate).toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">
                              {getUnitDisplay(service.unit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleServiceMutation.mutate({ 
                          id: service.id, 
                          isActive: !service.isActive 
                        })}
                        disabled={toggleServiceMutation.isPending}
                      >
                        {service.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      
                      <Link href={`/services/${service.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{service.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteServiceMutation.mutate(service.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "No items found" : "No services yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Add your first service, product, or material to get started"
                }
              </p>
              {!searchTerm && (
                <Link href="/services/new">
                  <Button className="btn-primary">Add Service</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}