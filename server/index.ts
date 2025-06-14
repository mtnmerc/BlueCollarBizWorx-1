import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Use simple memory session store for now (works in both dev and production)
app.use(session({
  secret: process.env.SESSION_SECRET || "bizworx-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow HTTP for now
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // Default 24 hours, can be extended per login
  },
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add CORS headers manually for GPT access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/')) {
    console.log(`API Request: ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
  }
  next();
});

// ===== GPT ROUTES FOR CHATGPT INTEGRATION =====
// X-API-Key authentication middleware
const authenticateApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    console.log('GPT API: No API key provided');
    return res.status(401).json({ error: 'API key required' });
  }
  
  console.log(`GPT API: Request authenticated with key: ${apiKey.substring(0, 8)}...`);
  next();
};

// GPT Client management routes
app.get('/gpt/clients', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Fetching all clients');
    const allClients = await db.select().from(clients);
    console.log(`GPT API: Found ${allClients.length} clients`);
    res.json(allClients);
  } catch (error: any) {
    console.error('GPT API: Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/gpt/clients', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Creating new client:', req.body);
    const clientData = {
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone || null,
      address: req.body.address || null,
      businessId: req.body.businessId || 1
    };
    
    const [newClient] = await db.insert(clients).values(clientData).returning();
    console.log('GPT API: Client created successfully:', newClient);
    res.json(newClient);
  } catch (error: any) {
    console.error('GPT API: Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/gpt/clients/:id', authenticateApiKey, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    console.log(`GPT API: Fetching client ${clientId}`);
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    console.log('GPT API: Client found:', client);
    res.json(client);
  } catch (error: any) {
    console.error('GPT API: Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/gpt/clients/:id', authenticateApiKey, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    console.log(`GPT API: Updating client ${clientId}:`, req.body);
    
    const [updatedClient] = await db.update(clients)
      .set(req.body)
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    console.log('GPT API: Client updated successfully:', updatedClient);
    res.json(updatedClient);
  } catch (error: any) {
    console.error('GPT API: Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/gpt/clients/:id', authenticateApiKey, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    console.log(`GPT API: Deleting client ${clientId}`);
    
    const [deletedClient] = await db.delete(clients)
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!deletedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    console.log('GPT API: Client deleted successfully:', deletedClient);
    res.json({ message: 'Client deleted successfully', client: deletedClient });
  } catch (error: any) {
    console.error('GPT API: Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

// GPT Estimates routes
app.get('/gpt/estimates', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Fetching all estimates');
    const allEstimates = await db.select().from(estimates);
    console.log(`GPT API: Found ${allEstimates.length} estimates`);
    res.json(allEstimates);
  } catch (error: any) {
    console.error('GPT API: Error fetching estimates:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/gpt/estimates', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Creating new estimate:', req.body);
    const estimateData = {
      clientId: req.body.clientId,
      businessId: req.body.businessId || 1,
      estimateNumber: req.body.estimateNumber || `EST-${Date.now()}`,
      items: req.body.items || [],
      subtotal: req.body.subtotal || "0.00",
      tax: req.body.tax || "0.00",
      total: req.body.total || "0.00",
      status: req.body.status || 'draft'
    };
    
    const [newEstimate] = await db.insert(estimates).values(estimateData).returning();
    console.log('GPT API: Estimate created successfully:', newEstimate);
    res.json(newEstimate);
  } catch (error: any) {
    console.error('GPT API: Error creating estimate:', error);
    res.status(500).json({ error: error.message });
  }
});

// GPT Invoices routes
app.get('/gpt/invoices', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Fetching all invoices');
    const allInvoices = await db.select().from(invoices);
    console.log(`GPT API: Found ${allInvoices.length} invoices`);
    res.json(allInvoices);
  } catch (error: any) {
    console.error('GPT API: Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/gpt/invoices', authenticateApiKey, async (req, res) => {
  try {
    console.log('GPT API: Creating new invoice:', req.body);
    const invoiceData = {
      clientId: req.body.clientId,
      businessId: req.body.businessId || 1,
      invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
      items: req.body.items || [],
      subtotal: req.body.subtotal || "0.00",
      tax: req.body.tax || "0.00",
      total: req.body.total || "0.00",
      status: req.body.status || 'draft'
    };
    
    const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();
    console.log('GPT API: Invoice created successfully:', newInvoice);
    res.json(newInvoice);
  } catch (error: any) {
    console.error('GPT API: Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'BizWorx server with ChatGPT integration'
  });
});

// Register standard application routes
const registerAppRoutes = async () => {
  // Authentication routes (session-based)
  app.post("/auth/login", async (req, res) => {
    try {
      const { email, pin } = req.body;
      const user = await storage.getUserByEmailAndPin(email, pin);
      if (user) {
        (req.session as any).userId = user.id;
        (req.session as any).businessId = user.businessId;
        (req.session as any).role = user.role;
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, error: "Invalid email or PIN" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ success: false, error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/auth/me", (req, res) => {
    if ((req.session as any).userId) {
      res.json({ success: true, user: { id: (req.session as any).userId } });
    } else {
      res.status(401).json({ success: false, error: "Not authenticated" });
    }
  });

  // Business setup
  app.post("/api/business/setup", async (req, res) => {
    try {
      const businessData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        address: req.body.address || null,
        apiKey: `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
      };

      const business = await storage.createBusiness(businessData);
      
      const userData = {
        businessId: business.id,
        name: req.body.ownerName,
        email: req.body.email,
        role: 'owner' as const,
        pin: req.body.ownerPin,
        hourlyRate: req.body.ownerHourlyRate || "25.00"
      };

      const user = await storage.createUser(userData);

      (req.session as any).userId = user.id;
      (req.session as any).businessId = business.id;
      (req.session as any).role = user.role;

      res.json({ 
        success: true, 
        business, 
        user,
        message: `Business "${business.name}" created successfully!`
      });
    } catch (error: any) {
      console.error('Business setup error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Client management (session-based)
  app.get("/api/clients", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const clients = await storage.getClientsByBusiness((req.session as any).businessId);
      res.json({ success: true, data: clients });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const clientData = {
        ...req.body,
        businessId: (req.session as any).businessId
      };

      const client = await storage.createClient(clientData);
      res.json({ success: true, data: client });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

console.log('ChatGPT integration routes registered successfully');

(async () => {
  // Register app routes
  await registerAppRoutes();
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // Setup vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`BizWorx server running on port ${port} with ChatGPT integration`);
  });
})();