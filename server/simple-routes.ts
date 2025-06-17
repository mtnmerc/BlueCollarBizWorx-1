import type { Express } from "express";

export async function registerRoutes(app: Express) {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock auth for testing
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    
    if (email === "demo@bizworx.com" && password === "demo123") {
      const mockUser = {
        id: 1,
        businessId: 1,
        username: "admin",
        firstName: "Demo",
        lastName: "User",
        role: "admin"
      };
      
      const mockBusiness = {
        id: 1,
        name: "Demo Construction Co.",
        email: "demo@bizworx.com",
        phone: "(555) 123-4567"
      };

      req.session.userId = mockUser.id;
      req.session.businessId = mockBusiness.id;
      
      res.json({ user: mockUser, business: mockBusiness });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }
    
    res.json({
      user: {
        id: 1,
        businessId: 1,
        username: "admin",
        firstName: "Demo",
        lastName: "User",
        role: "admin"
      },
      business: {
        id: 1,
        name: "Demo Construction Co.",
        email: "demo@bizworx.com",
        phone: "(555) 123-4567"
      }
    });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Mock dashboard stats
  app.get("/api/dashboard/stats", (req, res) => {
    res.json({
      totalClients: 3,
      activeJobs: 2,
      pendingEstimates: 1,
      monthlyRevenue: 12500,
      recentActivity: [
        {
          id: 1,
          type: "job",
          description: "Started Kitchen Renovation for John Smith",
          createdAt: new Date().toISOString()
        }
      ]
    });
  });

  // Mock clients
  app.get("/api/clients", (req, res) => {
    res.json([
      {
        id: 1,
        name: "John Smith",
        email: "john@example.com",
        phone: "(555) 111-2222",
        address: "456 Oak Ave, Anytown, USA",
        createdAt: "2025-01-15T10:00:00Z"
      },
      {
        id: 2,
        name: "ABC Restaurant",
        email: "manager@abcrestaurant.com",
        phone: "(555) 333-4444",
        address: "789 Commercial St, Anytown, USA",
        createdAt: "2025-01-14T14:30:00Z"
      }
    ]);
  });

  // Mock jobs
  app.get("/api/jobs", (req, res) => {
    res.json([
      {
        id: 1,
        title: "Kitchen Renovation",
        description: "Full kitchen remodel including cabinets and countertops",
        clientName: "John Smith",
        address: "456 Oak Ave, Anytown, USA",
        scheduledStart: "2025-01-20T09:00:00Z",
        status: "scheduled",
        priority: "high",
        estimatedAmount: 15000
      },
      {
        id: 2,
        title: "HVAC System Repair",
        description: "Commercial HVAC maintenance",
        clientName: "ABC Restaurant",
        address: "789 Commercial St, Anytown, USA",
        scheduledStart: "2025-01-18T08:00:00Z",
        status: "in_progress",
        priority: "urgent",
        estimatedAmount: 2500
      }
    ]);
  });

  // Mock estimates
  app.get("/api/estimates", (req, res) => {
    res.json([
      {
        id: 1,
        estimateNumber: "EST-2025-001",
        title: "Bathroom Remodel Estimate",
        clientName: "Sarah Johnson",
        total: 6170.25,
        status: "sent",
        validUntil: "2025-02-15T00:00:00Z",
        createdAt: "2025-01-15T12:00:00Z"
      }
    ]);
  });

  // Mock invoices
  app.get("/api/invoices", (req, res) => {
    res.json([
      {
        id: 1,
        invoiceNumber: "INV-2025-001",
        title: "Kitchen Renovation - Progress Payment",
        clientName: "John Smith",
        total: 5737.25,
        status: "sent",
        dueDate: "2025-02-01T00:00:00Z",
        paidDate: null,
        createdAt: "2025-01-16T10:00:00Z"
      }
    ]);
  });

  return app;
}