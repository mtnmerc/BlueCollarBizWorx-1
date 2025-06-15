import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, FileText, Plus, Trash2, Package } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

const estimateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  validUntil: z.string().optional(),
  depositType: z.enum(["none", "fixed", "percentage"]).default("none"),
  depositValue: z.string().optional(),
});

interface ServiceLineItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  rate: number;
  unit: string;
  total: number;
}

export default function EstimateNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceLineItems, setServiceLineItems] = useState<ServiceLineItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<z.infer<typeof estimateSchema>>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      validUntil: "",
      depositType: "none",
      depositValue: "",
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  // Calculate total amount whenever service line items change
  useEffect(() => {
    const total = serviceLineItems.reduce((sum, item) => sum + item.total, 0);
    setTotalAmount(total);
  }, [serviceLineItems]);

  const addServiceLine = () => {
    setServiceLineItems([...serviceLineItems, {
      serviceId: "",
      serviceName: "",
      quantity: 1,
      rate: 0,
      unit: "",
      total: 0
    }]);
  };

  const removeServiceLine = (index: number) => {
    setServiceLineItems(serviceLineItems.filter((_, i) => i !== index));
  };

  const updateServiceLine = (index: number, field: keyof ServiceLineItem, value: any) => {
    const updatedItems = [...serviceLineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If service is selected, update name, rate, and unit
    if (field === 'serviceId' && services) {
      const servicesArray = Array.isArray(services) ? services : [];
      const selectedService = servicesArray.find((s: any) => s.id.toString() === value);
      if (selectedService) {
        updatedItems[index].serviceName = selectedService.name;
        updatedItems[index].rate = parseFloat(selectedService.rate || 0);
        updatedItems[index].unit = selectedService.unit || 'each';
      }
    }
    
    // Recalculate total for this line item
    updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].rate;
    
    setServiceLineItems(updatedItems);
  };

  const createEstimateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/estimates", data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      const isDraft = data.status === 'draft';
      toast({
        title: isDraft ? "Draft Saved" : "Estimate Created",
        description: isDraft ? "Draft estimate has been saved successfully." : "Estimate has been created successfully.",
      });
      window.location.href = "/estimates";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create estimate",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof estimateSchema>) => {
    // Create draft estimate - no services required, minimal validation
    const validUntilDate = values.validUntil ? new Date(values.validUntil).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days from now

    createEstimateMutation.mutate({
      clientId: parseInt(values.clientId),
      title: values.title,
      description: values.description,
      lineItems: serviceLineItems.map(item => ({
        description: item.serviceName,
        quantity: item.quantity,
        rate: item.rate.toString(),
        amount: item.total.toString()
      })),
      subtotal: totalAmount.toString(),
      total: totalAmount.toString(),
      depositRequired: false,
      depositType: "fixed",
      validUntil: validUntilDate,
      status: "draft",
    });
  };

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">New Estimate</h1>
              <p className="text-muted-foreground">Create a new estimate for your client</p>
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
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter estimate title" {...field} />
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
                          placeholder="Describe the work to be estimated..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service Line Items Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">Services & Line Items</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {serviceLineItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No services added yet. Click "Add Service" to start building your estimate.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Column Headers - Mobile Optimized */}
                        <div className="grid grid-cols-6 gap-1 px-2 py-2 bg-muted/30 rounded-md text-xs font-medium text-muted-foreground">
                          <div className="col-span-2">Service</div>
                          <div className="col-span-1 text-center">Qty</div>
                          <div className="col-span-1 text-center">Rate</div>
                          <div className="col-span-1 text-center">Total</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {/* Service Line Items - Mobile Optimized */}
                        {serviceLineItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-6 gap-1 items-center p-2 border rounded-lg bg-card">
                            <div className="col-span-2">
                              <Select
                                value={item.serviceId}
                                onValueChange={(value) => updateServiceLine(index, 'serviceId', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.isArray(services) && services.map((service: any) => (
                                    <SelectItem key={service.id} value={service.id.toString()}>
                                      {service.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.quantity}
                                onChange={(e) => updateServiceLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="h-8 text-center text-xs p-1"
                                placeholder="1"
                              />
                            </div>
                            <div className="col-span-1">
                              <div className="h-8 px-1 py-2 text-xs bg-muted rounded text-center">
                                ${item.rate.toFixed(0)}
                              </div>
                            </div>
                            <div className="col-span-1">
                              <div className="h-8 px-1 py-2 text-xs bg-primary/10 rounded text-center font-medium text-primary">
                                ${item.total.toFixed(0)}
                              </div>
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeServiceLine(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {serviceLineItems.length > 0 && (
                      <div className="flex justify-end pt-4 border-t">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total Estimate</div>
                          <div className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Deposit Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Deposit Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="depositType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Requirement</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select deposit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Deposit Required</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="percentage">Percentage of Total</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("depositType") !== "none" && (
                      <FormField
                        control={form.control}
                        name="depositValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("depositType") === "fixed" ? "Deposit Amount ($)" : "Deposit Percentage (%)"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step={form.watch("depositType") === "fixed" ? "0.01" : "1"}
                                min="0"
                                max={form.watch("depositType") === "percentage" ? "100" : undefined}
                                placeholder={form.watch("depositType") === "fixed" ? "0.00" : "0"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("depositType") !== "none" && form.watch("depositValue") && totalAmount > 0 && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Calculated Deposit</div>
                        <div className="text-lg font-bold text-primary">
                          ${(() => {
                            const depositValue = parseFloat(form.watch("depositValue") || "0");
                            if (form.watch("depositType") === "fixed") {
                              return depositValue.toFixed(2);
                            } else {
                              return ((totalAmount * depositValue) / 100).toFixed(2);
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    className="flex-1 gradient-primary"
                    disabled={createEstimateMutation.isPending}
                  >
                    {createEstimateMutation.isPending ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Link href="/estimates">
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