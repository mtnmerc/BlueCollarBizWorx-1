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
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

const estimateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
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
      const selectedService = services.find((s: any) => s.id.toString() === value);
      if (selectedService) {
        updatedItems[index].serviceName = selectedService.name;
        updatedItems[index].rate = parseFloat(selectedService.rate);
        updatedItems[index].unit = selectedService.unit;
      }
    }
    
    // Recalculate total for this line item
    updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].rate;
    
    setServiceLineItems(updatedItems);
  };

  const createEstimateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/estimates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({
        title: "Estimate Created",
        description: "Estimate has been created successfully.",
      });
      window.location.href = "/invoices";
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
    if (serviceLineItems.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please add at least one service to the estimate.",
        variant: "destructive",
      });
      return;
    }

    createEstimateMutation.mutate({
      clientId: parseInt(values.clientId),
      title: values.title,
      description: values.description,
      amount: totalAmount,
      validUntil: values.validUntil,
      status: "pending",
      serviceLineItems: serviceLineItems,
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
                      serviceLineItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                          <div className="col-span-4">
                            <label className="text-sm font-medium">Service</label>
                            <Select
                              value={item.serviceId}
                              onValueChange={(value) => updateServiceLine(index, 'serviceId', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(services) && services.map((service: any) => (
                                  <SelectItem key={service.id} value={service.id.toString()}>
                                    {service.name} - ${service.rate}/{service.unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Qty</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateServiceLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Rate</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateServiceLine(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Unit</label>
                            <Input
                              value={item.unit}
                              readOnly
                              className="h-8 bg-muted"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-sm font-medium">Total</label>
                            <div className="h-8 px-3 py-1 text-sm bg-muted rounded text-right">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeServiceLine(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
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
                    {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                  </Button>
                  <Link href="/invoices">
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