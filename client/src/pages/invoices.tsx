import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Edit, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount.toString()));
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "paid": "status-paid",
      "pending": "status-pending",
      "overdue": "status-overdue",
      "draft": "bg-gray-500 text-white",
      "sent": "bg-blue-500 text-white",
    };
    
    return (
      <Badge className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || ""}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <Button className="btn-primary" asChild>
            <a href="/invoices/new">
              <Plus className="h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {["all", "paid", "pending", "overdue", "draft"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="whitespace-nowrap"
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="px-4 py-6">
        {filteredInvoices.length > 0 ? (
          <div className="space-y-3">
            {filteredInvoices.map((invoice: any) => (
              <Card key={invoice.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {invoice.client?.name || "Unknown Client"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground mb-1">
                        {formatCurrency(invoice.total)}
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                    <span>{invoice.title}</span>
                  </div>

                  {invoice.status === "overdue" && (
                    <div className="text-xs text-red-400 mb-3">
                      Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "No due date"}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Link href={`/invoices/${invoice.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/invoices/${invoice.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter"
                  : "Create your first invoice to get started"}
              </p>
              <Button className="btn-primary" asChild>
                <a href="/invoices/new">Create Invoice</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
