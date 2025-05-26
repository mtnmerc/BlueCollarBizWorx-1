import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Check, X, MessageSquare, Building2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PublicEstimate() {
  const params = useParams();
  const shareToken = params.shareToken;
  const { toast } = useToast();
  const [response, setResponse] = useState("");
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"approved" | "rejected" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/public/estimates/${shareToken}`],
    queryFn: () => fetch(`/api/public/estimates/${shareToken}`).then(res => res.json()),
    enabled: !!shareToken,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ status, response }: { status: string; response: string }) => {
      return apiRequest(`/api/public/estimates/${shareToken}/respond`, {
        method: "POST",
        body: JSON.stringify({ status, response }),
      });
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
    respondMutation.mutate({ status: selectedAction, response });
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
              <Badge className={`${getStatusColor(estimate.status)} text-white`}>
                {estimate.status?.toUpperCase()}
              </Badge>
            </div>

            {estimate.description && (
              <p className="text-muted-foreground mb-4">{estimate.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Client:</span> {client?.name}
              </div>
              {estimate.validUntil && (
                <div>
                  <span className="font-medium">Valid Until:</span>{" "}
                  {new Date(estimate.validUntil).toLocaleDateString()}
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