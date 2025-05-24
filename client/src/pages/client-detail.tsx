import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  DollarSign,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: client, isLoading } = useQuery({
    queryKey: ["/api/clients", id],
    queryFn: () => fetch(`/api/clients/${id}`).then(res => res.json()),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs", "client", id],
    queryFn: () => fetch(`/api/jobs?clientId=${id}`).then(res => res.json()),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/invoices", "client", id],
    queryFn: () => fetch(`/api/invoices?clientId=${id}`).then(res => res.json()),
  });

  const handleMapClick = () => {
    if (client?.address) {
      const encodedAddress = encodeURIComponent(client.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Client Not Found</h1>
          <Link href="/clients">
            <Button className="mt-4">Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <p className="text-muted-foreground">Client Details</p>
          </div>
          <Link href={`/clients/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-foreground hover:text-primary"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>

                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a 
                        href={`tel:${client.phone}`}
                        className="text-foreground hover:text-primary"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-left justify-start text-foreground hover:text-primary"
                        onClick={handleMapClick}
                      >
                        <span className="break-words">{client.address}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
                <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="jobs" className="space-y-4">
                {jobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Jobs Yet</h3>
                      <p className="text-muted-foreground mb-4">This client doesn't have any scheduled jobs.</p>
                      <Link href={`/jobs/new?clientId=${id}`}>
                        <Button>Schedule First Job</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job: any) => (
                    <Card key={job.id} className="interactive-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{job.title}</h4>
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(job.scheduledDate).toLocaleDateString()}
                              </span>
                              <Badge variant="outline">{job.status}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Est. Hours</p>
                            <p className="font-semibold">{job.estimatedHours}h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="invoices" className="space-y-4">
                {invoices.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Invoices Yet</h3>
                      <p className="text-muted-foreground mb-4">This client doesn't have any invoices.</p>
                      <Link href={`/invoices/new?clientId=${id}`}>
                        <Button>Create First Invoice</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  invoices.map((invoice: any) => (
                    <Card key={invoice.id} className="interactive-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">Invoice #{invoice.invoiceNumber}</h4>
                            <p className="text-sm text-muted-foreground">{invoice.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-muted-foreground">
                                Due: {new Date(invoice.dueDate).toLocaleDateString()}
                              </span>
                              <Badge variant="outline">{invoice.status}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-lg">{invoice.amount}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}