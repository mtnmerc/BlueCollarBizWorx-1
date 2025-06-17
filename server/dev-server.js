import express from "express";
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session middleware
app.use(session({
  secret: "bizworx-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Mock auth routes
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

// Mock data endpoints
app.get("/api/dashboard/stats", requireAuth, (req, res) => {
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

app.get("/api/clients", requireAuth, (req, res) => {
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

app.get("/api/jobs", requireAuth, (req, res) => {
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

app.get("/api/estimates", requireAuth, (req, res) => {
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

app.get("/api/invoices", requireAuth, (req, res) => {
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../dist/public")));
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../dist/public/index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`BizWorx server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Demo credentials: demo@bizworx.com / demo123');
});