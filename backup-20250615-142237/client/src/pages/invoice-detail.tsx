import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, User, CreditCard, CheckCircle, Mail, Copy, Share, MessageSquare, Trash2, PenTool, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InvoiceDetail() {
  const [match, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [shareToken, setShareToken] = useState<string>("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);





  // Signature drawing functions
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    }
  };

  useEffect(() => {
    if (showSignaturePad) {
      setTimeout(setupCanvas, 100);
    }
  }, [showSignaturePad]);

  const getEventPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getEventPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getEventPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: any) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      
      // If we're in payment recording mode, just set the signature for later use
      if (paymentDialogOpen) {
        setSignature(dataURL);
        setShowSignaturePad(false);
      } else {
        // If standalone signature collection, save directly to invoice
        collectSignatureMutation.mutate({ clientSignature: dataURL });
      }
    }
  };

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (photos: string[]) => 
      apiRequest("POST", `/api/invoices/${invoiceId}/photos`, { photos }),
    onSuccess: () => {
      toast({
        title: "Photos Uploaded",
        description: "Job photos have been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos",
        variant: "destructive",
      });
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const photoPromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 10 * 1024 * 1024) {
          reject(new Error(`File ${file.name} is too large. Maximum size is 10MB.`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    try {
      const photoData = await Promise.all(photoPromises);
      uploadPhotoMutation.mutate(photoData);
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }

    // Reset the input
    event.target.value = "";
  };

  // Remove photo
  const removePhoto = async (index: number) => {
    try {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}/photos/${index}`);
      toast({
        title: "Photo Removed",
        description: "Photo has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove photo",
        variant: "destructive",
      });
    }
  };

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

  const recordPaymentMutation = useMutation({
    mutationFn: (paymentData: { amount: number; method: string; notes?: string; clientSignature?: string }) => 
      apiRequest("POST", `/api/invoices/${invoiceId}/payment`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");
      setSignature(null);
      setSignatureRequired(false);
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const collectSignatureMutation = useMutation({
    mutationFn: (signatureData: { clientSignature: string }) => 
      apiRequest("PATCH", `/api/invoices/${invoiceId}/signature`, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      setShowSignaturePad(false);
      setSignature(null);
      toast({
        title: "Signature Collected",
        description: "Client signature has been successfully saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save signature. Please try again.",
        variant: "destructive",
      });
    }
  });

  const generateShareMutation = useMutation({
    mutationFn: async (): Promise<{ shareToken: string }> => {
      const response = await fetch(`/api/invoices/${invoiceId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to generate share link");
      }
      return response.json();
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully.",
      });
      setLocation("/invoices");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvoice = async () => {
    // Generate share token if not exists
    let token = shareToken;
    if (!token) {
      try {
        const response = await generateShareMutation.mutateAsync();
        token = response.shareToken;
        setShareToken(token);
      } catch (error) {
        return;
      }
    }

    const client = clients?.find((c: any) => c.id === invoice?.clientId);
    if (!client?.email) {
      toast({
        title: "No Client Email",
        description: "This client doesn't have an email address on file.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/invoice/${token}`;
    const subject = `Invoice: ${invoice?.title || invoice?.invoiceNumber}`;
    const messageText = `Hello ${client.name},

Please review your invoice for: ${invoice?.title}

View and pay online: ${shareUrl}

Due date: ${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'upon receipt'}

Thank you for your business!`;

    // Try native share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: messageText,
          url: shareUrl,
        });
        toast({
          title: "Shared Successfully",
          description: "Invoice shared via your preferred app.",
        });
        return;
      } catch (error) {
        // User cancelled sharing, continue to fallback
      }
    }

    // Fallback to copying link and showing instructions
    await navigator.clipboard.writeText(shareUrl);
    
    // Create Gmail link
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(client.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
    
    // Update invoice status to sent
    await fetch(`/api/invoices/${invoiceId}/send-email`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    
    // Open Gmail
    window.open(gmailUrl, '_blank');
    
    toast({
      title: "Invoice Ready to Send",
      description: "Link copied and Gmail opened. Send when ready!",
    });
  };

  const handleSendSMS = async () => {
    // Generate share token if not exists
    let token = shareToken;
    if (!token) {
      try {
        const response = await generateShareMutation.mutateAsync();
        token = response.shareToken;
        setShareToken(token);
      } catch (error) {
        return;
      }
    }

    const client = clients?.find((c: any) => c.id === invoice?.clientId);
    if (!client?.phone) {
      toast({
        title: "No Client Phone",
        description: "This client doesn't have a phone number on file.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/invoice/${token}`;
    const messageText = `Hi ${client.name}, please review your invoice for ${invoice?.title}: ${shareUrl}`;
    
    // Update invoice status to sent
    await fetch(`/api/invoices/${invoiceId}/send-email`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    
    const smsUrl = `sms:${client.phone}?body=${encodeURIComponent(messageText)}`;
    window.location.href = smsUrl;
    
    toast({
      title: "SMS App Opened",
      description: "Your SMS app should open with the invoice link ready to send.",
    });
  };

  const copyShareLink = async () => {
    // Generate share token if not exists
    let token = shareToken;
    if (!token) {
      try {
        const response = await generateShareMutation.mutateAsync();
        token = response.shareToken;
        setShareToken(token);
      } catch (error) {
        return;
      }
    }

    const shareUrl = `${window.location.origin}/invoice/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link Copied",
      description: "Invoice link copied to clipboard.",
    });
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (signatureRequired && !signature) {
      toast({
        title: "Signature Required",
        description: "Please collect client signature before recording payment.",
        variant: "destructive",
      });
      return;
    }

    recordPaymentMutation.mutate({
      amount,
      method: paymentMethod,
      notes: paymentNotes || undefined,
      clientSignature: signature || undefined,
    });
  };

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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteInvoiceMutation.mutate()}
                  disabled={deleteInvoiceMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteInvoiceMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="flex space-x-2">
            <Button 
              onClick={handleSendInvoice}
              className="bg-green-600 hover:bg-green-700" 
              size="sm"
              disabled={generateShareMutation.isPending}
            >
              <Share className="h-4 w-4 mr-2" />
              {generateShareMutation.isPending ? "Generating..." : "Share"}
            </Button>
            <Button 
              onClick={handleSendSMS}
              variant="outline" 
              size="sm"
              disabled={generateShareMutation.isPending}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </Button>
            <Button 
              onClick={copyShareLink}
              variant="outline" 
              size="sm"
              disabled={generateShareMutation.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
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
              {parseFloat((invoice as any).amountPaid || "0") > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid:</span>
                    <span className="font-medium">${parseFloat((invoice as any).amountPaid || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-orange-600">
                    <span>Remaining Balance:</span>
                    <span>${(total - parseFloat((invoice as any).amountPaid || "0")).toFixed(2)}</span>
                  </div>
                </>
              )}
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

        {/* Payment Recording Section */}
        {!paymentDialogOpen ? (
          <Button 
            variant="outline" 
            className="w-full mb-6"
            disabled={invoice?.status === "paid"}
            onClick={() => setPaymentDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={parseFloat(invoice?.total || "0")}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Invoice total: ${parseFloat(invoice?.total || "0").toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Notes (Optional)</Label>
                  <Input
                    id="payment-notes"
                    placeholder="Payment reference, check number, etc."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                {/* Signature Collection */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="signature-required" 
                      checked={signatureRequired}
                      onCheckedChange={(checked) => setSignatureRequired(checked as boolean)}
                    />
                    <label htmlFor="signature-required" className="text-sm font-medium">
                      Collect client signature
                    </label>
                  </div>
                  
                  {signatureRequired && (
                    <div className="ml-6 space-y-2">
                      {!signature ? (
                        <Button
                          onClick={() => setShowSignaturePad(true)}
                          variant="outline"
                          size="sm"
                          type="button"
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
                            type="button"
                          >
                            Clear Signature
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={recordPaymentMutation.isPending}
                    className="flex-1 gradient-primary"
                  >
                    {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Job Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="mx-auto h-12 w-12 text-muted-foreground">
                      📷
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-primary">Click to upload photos</span> or drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                  </div>
                </label>
              </div>

              {/* Display Photos */}
              {invoice.photos && Array.isArray(invoice.photos) && invoice.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {invoice.photos.map((photo: any, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.data || photo}
                        alt={photo.caption || `Job photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                      )}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!invoice.photos || !Array.isArray(invoice.photos) || invoice.photos.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No photos uploaded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* Client Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <PenTool className="h-4 w-4 mr-2" />
                Client Signature
              </span>
              {!invoice.clientSignature && (
                <Button
                  onClick={() => setShowSignaturePad(true)}
                  variant="outline"
                  size="sm"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Collect Signature
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.clientSignature ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-3 bg-muted max-w-md">
                  <img 
                    src={invoice.clientSignature} 
                    alt="Client Digital Signature" 
                    className="w-full h-20 object-contain"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Signed on: {invoice.signedAt ? new Date(invoice.signedAt).toLocaleString() : 'Date not available'}
                  </p>
                  <Button
                    onClick={() => setShowSignaturePad(true)}
                    variant="outline"
                    size="sm"
                  >
                    Update Signature
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  No signature collected yet. Signatures serve as proof of job completion and service delivery.
                </p>
                <Button
                  onClick={() => setShowSignaturePad(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Collect Client Signature
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signature Collection Inline Section */}
      {showSignaturePad && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                Collect Client Signature
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSignaturePad(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">
                Have the client sign below to confirm payment. Use finger or stylus on mobile devices.
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
      )}
    </div>
  );
}