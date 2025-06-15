import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Phone, Mail, MapPin, Eye, Edit, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const filteredClients = Array.isArray(clients) ? clients.filter((client: any) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  ) : [];

  if (isLoading) {
    return (
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-12 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20">
      {/* Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <Button className="btn-primary" asChild>
            <a href="/clients/new">
              <Plus className="h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="px-4 py-6">
        {filteredClients.length > 0 ? (
          <div className="space-y-3">
            {filteredClients.map((client: any) => (
              <Card key={client.id} className="interactive-card">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                        {client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{client.name}</h3>
                      
                      {client.email && (
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Mail className="h-4 w-4 mr-2" />
                          <a href={`mailto:${client.email}`} className="hover:text-accent">
                            {client.email}
                          </a>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Phone className="h-4 w-4 mr-2" />
                          <a href={`tel:${client.phone}`} className="hover:text-accent">
                            {client.phone}
                          </a>
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4 mr-2" />
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const encodedAddress = encodeURIComponent(client.address);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                            }}
                          >
                            {client.address}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Link href={`/clients/${client.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View History
                          </Button>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Add your first client to get started"
                }
              </p>
              {!searchTerm && (
                <Button className="btn-primary" asChild>
                  <a href="/clients/new">Add Client</a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
