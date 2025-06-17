import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt, User, Calendar, DollarSign, AlertCircle } from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  clientName: string;
  total: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
}

async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch('/api/invoices');
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function Invoices() {
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: fetchInvoices,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
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
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Unable to load invoices. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || !dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {!invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No invoices created</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first invoice to start billing clients for completed work.
            </p>
            <Button>Create Invoice</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <Receipt className="w-5 h-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{invoice.title}</h3>
                          <Badge className="text-xs">#{invoice.invoiceNumber}</Badge>
                          {invoice.dueDate && isOverdue(invoice.dueDate, invoice.status) && (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              <span className="text-xs">Overdue</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {invoice.clientName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Created {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                          {invoice.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Due {new Date(invoice.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {invoice.paidDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Paid {new Date(invoice.paidDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-1">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold">
                          ${invoice.total.toFixed(2)}
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