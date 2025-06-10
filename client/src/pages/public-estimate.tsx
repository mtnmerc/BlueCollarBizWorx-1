import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Check, X, MessageSquare, Building2, Calendar, RotateCcw, PenTool, User, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PublicEstimate() {
  const params = useParams();
  const shareToken = params.shareToken;
  const { toast } = useToast();
  const [response, setResponse] = useState("");
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"approved" | "rejected" | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/public/estimates/${shareToken}`],
    queryFn: () => fetch(`/api/public/estimates/${shareToken}`).then(res => res.json()),
    enabled: !!shareToken,
  });

  // Signature canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [showSignaturePad]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
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
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
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
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL();
    setSignature(signatureData);
    setShowSignaturePad(false);
  };

  const respondMutation = useMutation({
    mutationFn: async ({ status, response, signature }: { status: string; response: string; signature?: string }) => {
      const result = await fetch(`/api/public/estimates/${shareToken}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, response, signature }),
      });
      return result.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the business owner.",
      });
      setShowResponseForm(false);
      setResponse("");
      setSelectedAction(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: "approved" | "rejected") => {
    setSelectedAction(action);
    setShowResponseForm(true);
  };

  const submitResponse = () => {
    if (!selectedAction) return;
    
    if (selectedAction === "rejected" && !response.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide feedback when rejecting an estimate.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAction === "approved" && !signature) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to approve this estimate.",
        variant: "destructive",
      });
      return;
    }

    respondMutation.mutate({
      status: selectedAction,
      response: response,
      signature: signature || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.estimate) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <X className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Estimate Not Found</h2>
            <p className="text-muted-foreground">
              This estimate link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { estimate, business, client } = data;
  const lineItems = Array.isArray(estimate.lineItems) ? estimate.lineItems : [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-green-600";
      case "rejected": return "bg-red-600";
      case "sent": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);
  };

  const downloadPDF = async () => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF();
      
      // Set up the PDF layout
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Add business logo if available
      if (business?.logo) {
        try {
          // Convert logo to base64 and add to PDF
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          
          await new Promise((resolve, reject) => {
            logoImg.onload = () => {
              try {
                // Create canvas to convert image to base64
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = logoImg.width;
                canvas.height = logoImg.height;
                ctx?.drawImage(logoImg, 0, 0);
                
                const logoData = canvas.toDataURL('image/png');
                
                // Add logo to PDF (30x30 size)
                pdf.addImage(logoData, 'PNG', margin, yPosition, 30, 30);
                yPosition += 35;
                resolve(true);
              } catch (error) {
                console.warn("Could not add logo to PDF:", error);
                resolve(false);
              }
            };
            logoImg.onerror = () => {
              console.warn("Could not load logo for PDF");
              resolve(false);
            };
            logoImg.src = business.logo;
          });
        } catch (error) {
          console.warn("Logo processing failed:", error);
        }
      }
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(business?.name || "Business Name", margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      if (business?.email) {
        pdf.text(`Email: ${business.email}`, margin, yPosition);
        yPosition += 6;
      }
      if (business?.phone) {
        pdf.text(`Phone: ${business.phone}`, margin, yPosition);
        yPosition += 6;
      }
      if (business?.address) {
        pdf.text(`Address: ${business.address}`, margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      
      // Estimate header
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("ESTIMATE", margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Estimate #: ${estimate.estimateNumber}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 6;
      if (estimate.validUntil) {
        pdf.text(`Valid Until: ${new Date(estimate.validUntil).toLocaleDateString()}`, margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      
      // Client information
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Client Information:", margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      if (client?.name) {
        pdf.text(`Name: ${client.name}`, margin, yPosition);
        yPosition += 6;
      }
      if (client?.email) {
        pdf.text(`Email: ${client.email}`, margin, yPosition);
        yPosition += 6;
      }
      if (client?.phone) {
        pdf.text(`Phone: ${client.phone}`, margin, yPosition);
        yPosition += 6;
      }
      if (client?.address) {
        pdf.text(`Address: ${client.address}`, margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      
      // Line items header
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Services & Items:", margin, yPosition);
      yPosition += 8;
      
      // Table header
      pdf.setFontSize(9);
      pdf.text("Description", margin, yPosition);
      pdf.text("Qty", pageWidth - 80, yPosition);
      pdf.text("Rate", pageWidth - 60, yPosition);
      pdf.text("Amount", pageWidth - 30, yPosition);
      yPosition += 6;
      
      // Draw line under header
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;
      
      // Line items
      pdf.setFont("helvetica", "normal");
      lineItems.forEach((item: any) => {
        pdf.text(item.description || "", margin, yPosition);
        pdf.text(item.quantity?.toString() || "1", pageWidth - 80, yPosition);
        pdf.text(formatCurrency(item.rate || 0), pageWidth - 60, yPosition);
        pdf.text(formatCurrency(item.amount || 0), pageWidth - 30, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // Totals
      pdf.setFont("helvetica", "bold");
      pdf.text(`Subtotal: ${formatCurrency(estimate.subtotal)}`, pageWidth - 80, yPosition);
      yPosition += 6;
      
      if (parseFloat(estimate.taxAmount) > 0) {
        pdf.text(`Tax: ${formatCurrency(estimate.taxAmount)}`, pageWidth - 80, yPosition);
        yPosition += 6;
      }
      
      if (estimate.depositRequired && estimate.depositAmount) {
        pdf.text(`Deposit Required: ${formatCurrency(estimate.depositAmount)}`, pageWidth - 80, yPosition);
        yPosition += 6;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Total: ${formatCurrency(estimate.total)}`, pageWidth - 80, yPosition);
      
      // Save the PDF
      pdf.save(`${estimate.estimateNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "The estimate has been downloaded as a PDF file.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Business Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              {business?.logo && (
                <img 
                  src={business.logo} 
                  alt="Business Logo" 
                  className="w-16 h-16 object-contain rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{business?.name}</h1>
                <p className="text-muted-foreground">{business?.email}</p>
                {business?.phone && (
                  <p className="text-muted-foreground">{business.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimate Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{estimate.title}</h2>
                  <p className="text-sm text-muted-foreground">{estimate.estimateNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={downloadPDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </Button>
                <Badge className={`${getStatusColor(estimate.status)} text-white`}>
                  {estimate.status?.toUpperCase()}
                </Badge>
              </div>
            </div>

            {estimate.description && (
              <p className="text-muted-foreground mb-4">{estimate.description}</p>
            )}

            {/* Client Information */}
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 flex items-center">
                <User className="h-4 w-4 text-primary mr-2" />
                Client Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-foreground">{client?.name}</div>
                {client?.email && (
                  <div className="text-muted-foreground">{client.email}</div>
                )}
                {client?.phone && (
                  <div className="text-muted-foreground">{client.phone}</div>
                )}
                {client?.address && (
                  <div className="text-muted-foreground">{client.address}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {estimate.validUntil && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-primary mr-2" />
                  <span className="text-muted-foreground">Valid until:</span>
                  <span className="ml-1">
                    {new Date(estimate.validUntil).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Estimate Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.rate)}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(estimate.subtotal)}</span>
              </div>
              {parseFloat(estimate.taxAmount || "0") > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({estimate.taxRate}%):</span>
                  <span>{formatCurrency(estimate.taxAmount)}</span>
                </div>
              )}
              {parseFloat(estimate.depositAmount || "0") > 0 && (
                <div className="flex justify-between">
                  <span>Deposit Required:</span>
                  <span>{formatCurrency(estimate.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total:</span>
                <span>{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {estimate.status !== "approved" && estimate.status !== "rejected" && !showResponseForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Respond to this Estimate</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => handleAction("approved")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Estimate
                </Button>
                <Button 
                  onClick={() => handleAction("rejected")}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Estimate
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedAction("rejected");
                    setShowResponseForm(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Suggest Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Form */}
        {showResponseForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {selectedAction === "approved" ? "Approve Estimate" : "Provide Feedback"}
              </h3>
              <Textarea
                placeholder={
                  selectedAction === "approved" 
                    ? "Optional: Add any comments about this approval..."
                    : "Please describe what changes you'd like to see or why you're rejecting this estimate..."
                }
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="mb-4"
                rows={4}
              />

              {/* Signature Section for Approvals */}
              {selectedAction === "approved" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center">
                      <PenTool className="h-4 w-4 mr-2" />
                      Digital Signature
                    </h4>
                    {signature && (
                      <Badge className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Signed
                      </Badge>
                    )}
                  </div>
                  
                  {!signature ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your signature is required to approve this estimate.
                      </p>
                      <Button
                        onClick={() => setShowSignaturePad(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Add Signature
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="border rounded-lg p-2 bg-muted">
                        <img 
                          src={signature} 
                          alt="Client Signature" 
                          className="w-full h-20 object-contain"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setSignature(null);
                          setShowSignaturePad(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Re-sign
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={submitResponse}
                  disabled={respondMutation.isPending}
                  className={selectedAction === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {respondMutation.isPending ? "Sending..." : `Send ${selectedAction === "approved" ? "Approval" : "Response"}`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowResponseForm(false);
                    setSelectedAction(null);
                    setResponse("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Collection Inline Section */}
        {showSignaturePad && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <PenTool className="h-5 w-5 mr-2" />
                  Sign to Approve Estimate
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
                  Please sign below to approve this estimate. Use your finger or stylus on mobile devices.
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
                  <RotateCcw className="h-4 w-4 mr-2" />
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

        {/* Client Response Display */}
        {estimate.clientResponse && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2">Client Response</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground">{estimate.clientResponse}</p>
                {estimate.clientRespondedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Responded on {new Date(estimate.clientRespondedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {estimate.notes && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2">Additional Notes</h3>
              <p className="text-muted-foreground">{estimate.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}