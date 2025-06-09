import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Calendar, User, DollarSign, Download, PenTool, Check } from "lucide-react";

export default function PublicInvoice() {
  const [match, params] = useRoute("/invoice/:shareToken");
  const shareToken = params?.shareToken;
  const { toast } = useToast();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: [`/api/public/invoice/${shareToken}`],
    enabled: !!shareToken,
  });

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    setSignature(dataURL);
    setShowSignaturePad(false);
    
    toast({
      title: "Signature Saved",
      description: "Your signature has been captured successfully.",
    });
  };

  // Set canvas size when signature pad opens
  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, [showSignaturePad]);

  // Payment confirmation mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod: 'other',
        paymentNotes: 'Payment confirmed by client'
      };
      
      if (signature) {
        payload.clientSignature = signature;
      }
      
      const response = await apiRequest("PATCH", `/api/public/invoice/${shareToken}/confirm-payment`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Thank you! Your payment has been confirmed.",
      });
      // Refresh the invoice data
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    },
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

          {/* Job Photos */}
          {invoice.photos && Array.isArray(invoice.photos) && invoice.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Job Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {invoice.photos.map((photo: any, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.data || photo}
                        alt={photo.caption || `Job photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                        onClick={() => {
                          // Open image in new tab for full view
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`
                              <img src="${photo.data || photo}" style="max-width: 100%; height: auto;" alt="Job photo ${index + 1}" />
                            `);
                          }
                        }}
                      />
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Confirmation Section */}
          {invoice.status !== "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Payment Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Please confirm when payment has been made for this invoice.
                </p>

                {/* Signature Option */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="signature-required" 
                      checked={signatureRequired}
                      onCheckedChange={(checked) => setSignatureRequired(checked as boolean)}
                    />
                    <label htmlFor="signature-required" className="text-sm font-medium">
                      Include digital signature
                    </label>
                  </div>
                  
                  {signatureRequired && (
                    <div className="ml-6 space-y-2">
                      {!signature ? (
                        <Button
                          onClick={() => setShowSignaturePad(true)}
                          variant="outline"
                          size="sm"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Add Signature
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Signature captured</span>
                            <Badge className="bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          </div>
                          <div className="border rounded-lg p-2 bg-muted max-w-sm">
                            <img 
                              src={signature} 
                              alt="Client Signature" 
                              className="w-full h-16 object-contain"
                            />
                          </div>
                          <Button
                            onClick={() => setSignature(null)}
                            variant="outline"
                            size="sm"
                          >
                            Clear Signature
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    onClick={() => confirmPaymentMutation.mutate()}
                    disabled={confirmPaymentMutation.isPending || (signatureRequired && !signature)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {confirmPaymentMutation.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Payment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paid Status */}
          {invoice.status === "paid" && (
            <Card>
              <CardContent className="py-6 text-center">
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <Check className="h-5 w-5 mr-2" />
                  Payment Confirmed
                </Badge>
                <p className="text-muted-foreground mt-2">
                  Thank you for your payment!
                </p>
                <Button variant="outline" className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </CardContent>
            </Card>
          )}

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

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Sign Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Please sign below to confirm payment. Use your finger or stylus on mobile devices.
                </p>
                <div className="border-2 border-dashed border-muted-foreground rounded-lg">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSignature} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Save Signature
                </Button>
                <Button onClick={clearSignature} variant="outline">
                  Clear
                </Button>
                <Button 
                  onClick={() => setShowSignaturePad(false)} 
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}