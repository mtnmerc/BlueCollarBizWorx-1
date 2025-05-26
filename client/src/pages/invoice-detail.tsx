import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, User, CreditCard, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InvoiceDetail() {
  const [match, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const collectDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/collect-deposit`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to Stripe payment page
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Payment Link Created",
          description: "Deposit payment link has been generated.",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  const markDepositCollectedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/mark-deposit-collected`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Marked as Collected",
        description: "The deposit has been successfully recorded as collected.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark deposit as collected",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="pt-16 pb-20 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Invoice not found</h3>
            <p className="text-muted-foreground mb-6">
              The invoice you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/invoices">
              <Button variant="outline">Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "sent": return "bg-blue-500";
      case "paid": return "bg-green-500";
      case "overdue": return "bg-red-500";
      case "cancelled": return "bg-gray-600";
      default: return "bg-gray-500";
    }
  };

  const subtotal = parseFloat(invoice.subtotal || "0");
  const taxAmount = parseFloat(invoice.taxAmount || "0");
  const total = parseFloat(invoice.total || "0");

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Invoice Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {invoice.status === "draft" && (
            <Button className="bg-primary hover:bg-primary/90" size="sm">
              Send Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{invoice.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{invoice.invoiceNumber}</p>
              </div>
              <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {invoice.description && (
              <p className="text-muted-foreground mb-4">{invoice.description}</p>
            )}
            
            {/* Client Information */}
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 flex items-center">
                <User className="h-4 w-4 text-primary mr-2" />
                Client Information
              </h4>
              {(() => {
                const client = clients?.find((c: any) => c.id === invoice.clientId);
                return client ? (
                  <div className="space-y-2 text-sm">
                    <div className="font-medium text-foreground">{client.name}</div>
                    {client.email && (
                      <div className="text-muted-foreground">{client.email}</div>
                    )}
                    {client.phone && (
                      <div className="text-muted-foreground">{client.phone}</div>
                    )}
                    {client.address && (
                      <div className="text-muted-foreground">{client.address}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Client #{invoice.clientId}</div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {invoice.dueDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-primary mr-2" />
                  <span className="text-muted-foreground">Due date:</span>
                  <span className="ml-1">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Services & Items</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.lineItems && invoice.lineItems.length > 0 ? (
              <div className="space-y-3">
                {invoice.lineItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${parseFloat(item.rate || "0").toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(item.amount || "0").toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No line items</p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.depositRequired && invoice.depositAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Required:</span>
                  <span className="font-medium">${parseFloat(invoice.depositAmount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount Due:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Status */}
        {invoice.depositRequired && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Deposit Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deposit Amount:</span>
                  <span className="font-semibold text-lg">${parseFloat(invoice.depositAmount || "0").toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={invoice.depositPaid ? "default" : "outline"}>
                    {invoice.depositPaid ? "Paid" : "Pending"}
                  </Badge>
                </div>

                {!invoice.depositPaid && (
                  <div className="pt-4 border-t space-y-3">
                    <Button 
                      onClick={() => collectDepositMutation.mutate()}
                      disabled={collectDepositMutation.isPending}
                      className="w-full gradient-primary"
                    >
                      {collectDepositMutation.isPending ? (
                        "Creating Payment Link..."
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Create Payment Link
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Creates a secure payment link for the client
                    </p>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => markDepositCollectedMutation.mutate()}
                      disabled={markDepositCollectedMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {markDepositCollectedMutation.isPending ? (
                        "Marking as Collected..."
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Collected (Cash/Check)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      For payments received by cash or check
                    </p>
                  </div>
                )}

                {/* Show Schedule Job button for invoices with deposits or always for testing */}
                <div className="space-y-3 mt-4">
                  {(invoice as any).depositPaid && (invoice as any).depositPaidAt && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Deposit paid on {new Date((invoice as any).depositPaidAt).toLocaleDateString()}
                    </div>
                  )}
                  <Link href={`/jobs/new?fromInvoice=${(invoice as any).id}`}>
                    <Button className="w-full gradient-primary">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Job
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Create a job schedule for this work
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}