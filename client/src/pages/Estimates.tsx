import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, User, Calendar, DollarSign } from "lucide-react";

interface Estimate {
  id: number;
  estimateNumber: string;
  title: string;
  clientName: string;
  total: number;
  status: string;
  validUntil?: string;
  createdAt: string;
}

async function fetchEstimates(): Promise<Estimate[]> {
  const response = await fetch('/api/estimates');
  if (!response.ok) {
    throw new Error('Failed to fetch estimates');
  }
  return response.json();
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  converted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function Estimates() {
  const { data: estimates, isLoading, error } = useQuery({
    queryKey: ['/api/estimates'],
    queryFn: fetchEstimates,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Estimates</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Estimate
          </Button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Estimates</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Unable to load estimates. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estimates</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Estimate
        </Button>
      </div>

      {!estimates || estimates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No estimates created</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first estimate to start sending quotes to clients.
            </p>
            <Button>Create Estimate</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {estimates.map((estimate) => (
            <Card key={estimate.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{estimate.title}</h3>
                          <Badge className="text-xs">#{estimate.estimateNumber}</Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {estimate.clientName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Created {new Date(estimate.createdAt).toLocaleDateString()}
                          </div>
                          {estimate.validUntil && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Valid until {new Date(estimate.validUntil).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <Badge className={statusColors[estimate.status as keyof typeof statusColors]}>
                          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-1">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold">
                          ${estimate.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}