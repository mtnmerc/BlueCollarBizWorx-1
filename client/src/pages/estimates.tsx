import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Estimates() {
  const { data: estimates, isLoading } = useQuery({
    queryKey: ["/api/estimates"],
  });

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
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

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Estimates</h1>
        <Link href="/estimates/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </Link>
      </div>

      {!estimates || estimates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No estimates yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first estimate to get started with your business.
            </p>
            <Link href="/estimates/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Estimate
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {estimates.map((estimate: any) => (
            <Card key={estimate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {estimate.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {estimate.estimateNumber}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(estimate.status)} text-white`}>
                    {estimate.status}
                  </Badge>
                </div>

                {estimate.description && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {estimate.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 text-primary mr-2" />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold ml-1">${estimate.total}</span>
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

                <div className="flex space-x-2">
                  <Link href={`/estimates/${estimate.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/estimates/${estimate.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  {estimate.status === "approved" && (
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Convert to Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}