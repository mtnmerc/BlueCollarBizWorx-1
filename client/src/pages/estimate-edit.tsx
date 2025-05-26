import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface ServiceLineItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  rate: number;
  unit: string;
  total: number;
}

const estimateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  status: z.enum(["draft", "sent", "accepted", "rejected"]),
});

export default function EstimateEdit() {
  const [match, params] = useRoute("/estimates/:id/edit");
  const estimateId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [lineItems, setLineItems] = useState<ServiceLineItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [depositRequired, setDepositRequired] = useState<boolean>(false);
  const [depositType, setDepositType] = useState<'fixed' | 'percentage'>('percentage');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositPercentage, setDepositPercentage] = useState<number>(25);

  const { data: estimate, isLoading: estimateLoading } = useQuery({
    queryKey: [`/api/estimates/${estimateId}`],
    enabled: !!estimateId,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm<z.infer<typeof estimateSchema>>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      validUntil: "",
      status: "draft",
    },
  });

  // Update form when estimate data is loaded
  useEffect(() => {
    if (estimate) {
      form.reset({
        clientId: estimate.clientId?.toString() || "",
        title: estimate.title || "",
        description: estimate.description || "",
        validUntil: estimate.validUntil ? new Date(estimate.validUntil).toISOString().split('T')[0] : "",
        status: estimate.status || "draft",
      });
      
      // Restore line items
      if (estimate.lineItems && Array.isArray(estimate.lineItems)) {
        const restoredLineItems = estimate.lineItems.map((item: any) => ({
          serviceId: item.serviceId || "",
          serviceName: item.description || "",
          quantity: item.quantity || 1,
          rate: parseFloat(item.rate) || 0,
          unit: item.unit || "hr",
          total: parseFloat(item.amount) || 0,
        }));
        setLineItems(restoredLineItems);
      }
      
      // Restore tax and deposit information
      setTaxRate(parseFloat(estimate.taxRate) || 0);
      setDepositRequired(estimate.depositRequired || false);
      setDepositType(estimate.depositType || 'percentage');
      setDepositAmount(parseFloat(estimate.depositAmount) || 0);
      setDepositPercentage(parseFloat(estimate.depositPercentage) || 25);
    }
  }, [estimate, form]);

  const updateEstimateMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("PATCH", `/api/estimates/${estimateId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Estimate updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: [`/api/estimates/${estimateId}`] });
      setLocation(`/estimates/${estimateId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update estimate",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const finalDepositAmount = depositRequired ? 
    (depositType === 'percentage' ? subtotal * (depositPercentage / 100) : depositAmount) : 0;
  const total = subtotal + taxAmount;

  // Service line item functions
  const addServiceLine = () => {
    setLineItems([...lineItems, {
      serviceId: "",
      serviceName: "",
      quantity: 1,
      rate: 0,
      unit: "hr",
      total: 0,
    }]);
  };

  const updateServiceLine = (index: number, field: string, value: any) => {
    const updatedItems = [...lineItems];
    if (field === 'serviceId') {
      const service = services?.find((s: any) => s.id.toString() === value);
      if (service) {
        updatedItems[index].serviceId = value;
        updatedItems[index].serviceName = service.name;
        updatedItems[index].rate = parseFloat(service.rate) || 0;
        updatedItems[index].unit = service.unit || "hr";
      }
    } else {
      updatedItems[index][field] = value;
    }
    
    if (field === 'quantity' || field === 'rate' || field === 'serviceId') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setLineItems(updatedItems);
  };

  const removeServiceLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const onSubmit = (values: z.infer<typeof estimateSchema>) => {
    const lineItemsData = lineItems.map(item => ({
      description: item.serviceName,
      quantity: item.quantity,
      rate: item.rate.toString(),
      amount: item.total.toString(),
      unit: item.unit,
    }));

    updateEstimateMutation.mutate({
      clientId: parseInt(values.clientId),
      title: values.title,
      description: values.description,
      validUntil: new Date(values.validUntil).toISOString(),
      status: values.status,
      lineItems: lineItemsData,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      depositRequired,
      depositType,
      depositAmount: finalDepositAmount.toFixed(2),
      depositPercentage: depositPercentage.toString(),
    });
  };

  if (estimateLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="pt-16 pb-20 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-foreground mb-2">Estimate not found</h3>
            <p className="text-muted-foreground mb-6">
              The estimate you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/estimates">
              <Button variant="outline">Back to Estimates</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href={`/estimates/${estimateId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Edit Estimate</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5 text-primary" />
              <span>Estimate Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client: any) => (
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter estimate title" 
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter estimate description" 
                          className="bg-background border-border text-foreground min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Valid Until</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
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
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
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
                    {lineItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No services added yet. Click "Add Service" to start building your estimate.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Column Headers */}
                        <div className="grid grid-cols-6 gap-1 px-2 py-2 bg-muted/30 rounded-md text-xs font-medium text-muted-foreground">
                          <div className="col-span-2">Service</div>
                          <div className="col-span-1 text-center">Qty</div>
                          <div className="col-span-1 text-center">Rate</div>
                          <div className="col-span-1 text-center">Total</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {/* Service Line Items */}
                        {lineItems.map((item, index) => (
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
                                className="h-8 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateServiceLine(index, 'rate', parseFloat(e.target.value) || 0)}
                                className="h-8 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-1 text-xs text-center font-medium">
                              ${item.total.toFixed(2)}
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeServiceLine(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals Section */}
                    {lineItems.length > 0 && (
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Tax Rate */}
                        <div className="flex justify-between items-center text-sm">
                          <Label htmlFor="taxRate">Tax Rate (%):</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-xs text-center"
                          />
                        </div>
                        
                        {taxAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax:</span>
                            <span>${taxAmount.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Deposit Section */}
                        <div className="space-y-3 border-t pt-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="depositRequired"
                              checked={depositRequired}
                              onChange={(e) => setDepositRequired(e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor="depositRequired" className="text-sm">Require Deposit</Label>
                          </div>
                          
                          {depositRequired && (
                            <div className="space-y-2 pl-6">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="percentage"
                                    name="depositType"
                                    checked={depositType === 'percentage'}
                                    onChange={() => setDepositType('percentage')}
                                  />
                                  <Label htmlFor="percentage" className="text-sm">Percentage</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="fixed"
                                    name="depositType"
                                    checked={depositType === 'fixed'}
                                    onChange={() => setDepositType('fixed')}
                                  />
                                  <Label htmlFor="fixed" className="text-sm">Fixed Amount</Label>
                                </div>
                              </div>
                              
                              {depositType === 'percentage' ? (
                                <div className="flex justify-between items-center text-sm">
                                  <Label htmlFor="depositPercentage">Deposit Percentage (%):</Label>
                                  <Input
                                    id="depositPercentage"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={depositPercentage}
                                    onChange={(e) => setDepositPercentage(parseFloat(e.target.value) || 0)}
                                    className="w-20 h-8 text-xs text-center"
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-between items-center text-sm">
                                  <Label htmlFor="depositAmount">Deposit Amount ($):</Label>
                                  <Input
                                    id="depositAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 text-xs text-center"
                                  />
                                </div>
                              )}
                              
                              <div className="flex justify-between text-sm text-primary">
                                <span>Deposit Required:</span>
                                <span>${finalDepositAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between text-base font-medium border-t pt-2">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex space-x-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateEstimateMutation.isPending}
                  >
                    {updateEstimateMutation.isPending ? "Updating..." : "Update Estimate"}
                  </Button>
                  <Link href={`/estimates/${estimateId}`}>
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