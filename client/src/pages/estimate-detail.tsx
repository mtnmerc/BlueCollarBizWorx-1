import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, User, Mail, Copy, Share, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function EstimateDetail() {
  const [match, params] = useRoute("/estimates/:id");
  const estimateId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shareToken, setShareToken] = useState<string | null>(null);

  const { data: estimate, isLoading } = useQuery({
    queryKey: [`/api/estimates/${estimateId}`],
    enabled: !!estimateId,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Generate share token mutation
  const generateShareMutation = useMutation({
    mutationFn: async (): Promise<{ shareToken: string }> => {
      const response = await fetch(`/api/estimates/${estimateId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to generate share token");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setShareToken(data.shareToken);
      toast({
        title: "Share Link Generated",
        description: "You can now send this estimate to your client.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEstimate = async () => {
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

    const client = clients?.find((c: any) => c.id === estimate?.clientId);
    if (!client?.email) {
      toast({
        title: "No Client Email",
        description: "This client doesn't have an email address on file.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/estimate/${token}`;
    const subject = `Estimate: ${estimate?.title || estimate?.estimateNumber}`;
    const messageText = `Hello ${client.name},

Please review your estimate for: ${estimate?.title}

View and respond online: ${shareUrl}

Valid until: ${estimate?.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : 'further notice'}

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
          description: "Estimate shared via your preferred app.",
        });
        return;
      } catch (error) {
        // User cancelled sharing, continue to fallback
      }
    }

    // Fallback to copying link and showing instructions
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Share link copied. You can now send it via email, text, or any messaging app.",
      duration: 5000,
    });
  };

  const handleSendSMS = async () => {
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

    const client = clients?.find((c: any) => c.id === estimate?.clientId);
    if (!client?.phone) {
      toast({
        title: "No Client Phone",
        description: "This client doesn't have a phone number on file.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/estimate/${token}`;
    const messageText = `Hi ${client.name}, please review your estimate for ${estimate?.title}: ${shareUrl}`;

    const smsUrl = `sms:${client.phone}?body=${encodeURIComponent(messageText)}`;
    window.location.href = smsUrl;
    
    toast({
      title: "SMS App Opened",
      description: "Your SMS app should open with the estimate link ready to send.",
    });
  };

  const copyShareLink = async () => {
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

    const shareUrl = `${window.location.origin}/estimate/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard.",
    });
  };

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
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

  // Debug: log the estimate data
  console.log("Estimate data:", estimate);

  if (!estimate || Object.keys(estimate).length === 0) {
    return (
      <div className="pt-16 pb-20 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "sent": return "bg-blue-500";
      case "approved": return "bg-green-500";
      case "rejected": return "bg-red-500";
      case "converted": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const subtotal = parseFloat(estimate.subtotal || "0");
  const taxAmount = parseFloat(estimate.taxAmount || "0");
  const depositAmount = parseFloat(estimate.depositAmount || "0");
  const total = parseFloat(estimate.total || "0");

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/estimates">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Estimate Details</h1>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="flex space-x-2">
            <Button 
              onClick={handleSendEstimate}
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
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Link href={`/estimates/${estimate.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            {estimate.status === "approved" && (
              <Button className="bg-primary hover:bg-primary/90" size="sm">
                Convert to Invoice
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{estimate.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{estimate.estimateNumber}</p>
              </div>
              <Badge className={`${getStatusColor(estimate.status)} text-white`}>
                {estimate.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {estimate.description && (
              <p className="text-muted-foreground mb-4">{estimate.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 text-primary mr-2" />
                <span className="text-muted-foreground">Client:</span>
                <span className="ml-1 font-medium">
                  {clients?.find(c => c.id === estimate.clientId)?.name || `Client #${estimate.clientId}`}
                </span>
              </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Services & Items</CardTitle>
          </CardHeader>
          <CardContent>
            {estimate.lineItems && estimate.lineItems.length > 0 ? (
              <div className="space-y-3">
                {estimate.lineItems.map((item: any, index: number) => (
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
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              {depositAmount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-primary font-medium">
                    <span>Required Deposit:</span>
                    <span>${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Remaining Balance:</span>
                    <span>${(total - depositAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {estimate.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{estimate.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}