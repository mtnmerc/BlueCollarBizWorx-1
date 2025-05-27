import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, DollarSign, Download } from "lucide-react";

export default function PublicInvoice() {
  const [match, params] = useRoute("/invoice/:shareToken");
  const shareToken = params?.shareToken;

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: [`/api/public/invoice/${shareToken}`],
    enabled: !!shareToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-64"></div>
          <div className="h-64 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Invoice Not Found</h3>
            <p className="text-muted-foreground">
              This invoice link may have expired or been removed.
            </p>
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Invoice</h1>
          <p className="text-muted-foreground">
            Please review the details below and submit payment if required.
          </p>
        </div>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{invoice.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{invoice.invoiceNumber}</p>
                </div>
                <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                  {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                </Badge>
              </div>
              {invoice.description && (
                <p className="text-muted-foreground">{invoice.description}</p>
              )}
            </CardHeader>
          </Card>

          {/* Invoice Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Client Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-foreground">{invoice.clientName}</p>
                {invoice.clientEmail && (
                  <p className="text-muted-foreground">{invoice.clientEmail}</p>
                )}
                {invoice.clientPhone && (
                  <p className="text-muted-foreground">{invoice.clientPhone}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoice.dueDate && (
                  <div>
                    <span className="text-muted-foreground">Due Date: </span>
                    <span className="text-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="text-foreground capitalize">{invoice.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.lineItems && Array.isArray(invoice.lineItems) && invoice.lineItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${parseFloat(item.rate || "0").toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      ${parseFloat(item.amount || "0").toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Information */}
          {invoice.depositRequired && invoice.depositAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Deposit Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deposit Amount:</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${parseFloat(invoice.depositAmount).toFixed(2)}
                  </span>
                </div>
                {!invoice.depositPaid && (
                  <div className="mt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Pay Deposit
                    </Button>
                  </div>
                )}
                {invoice.depositPaid && (
                  <div className="mt-4 text-center">
                    <Badge className="bg-green-500 text-white">
                      Deposit Paid
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {invoice.status !== "paid" && (
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Invoice
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}