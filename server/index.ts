import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

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

(async () => {
  // Add CORS middleware first
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Add debug middleware to log all API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/')) {
      console.log(`API Request: ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
    }
    next();
  });



  // MCP functionality consolidated in server/routes.ts





  // GPT Authentication middleware
  function authenticateGPT(req: any, res: any, next: any) {
    console.log('=== DIRECT GPT AUTH ===');
    console.log('URL:', req.url);
    
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      console.log('DIRECT: No API key provided');
      return res.status(401).json({ success: false, error: 'API key required' });
    }
    
    storage.getBusinessByApiKey(apiKey).then((business: any) => {
      if (!business) {
        console.log('DIRECT: Invalid API key');
        return res.status(401).json({ success: false, error: 'Invalid API key' });
      }
      console.log('DIRECT: Business authenticated:', business.name);
      req.business = business;
      next();
    }).catch((error: any) => {
      console.error('DIRECT: Auth error:', error);
      res.status(500).json({ success: false, error: 'Authentication error' });
    });
  }

  // DIRECT GPT ROUTES - SCHEMA COMPLIANT
  app.get('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
    console.log('=== DIRECT GPT ESTIMATES EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('DIRECT: Processing estimates for business:', business.name);

      const rawEstimates = await db
        .select({
          id: estimates.id,
          businessId: estimates.businessId,
          clientId: estimates.clientId,
          estimateNumber: estimates.estimateNumber,
          title: estimates.title,
          description: estimates.description,
          lineItems: estimates.lineItems,
          subtotal: estimates.subtotal,
          taxRate: estimates.taxRate,
          taxAmount: estimates.taxAmount,
          total: estimates.total,
          status: estimates.status,
          validUntil: estimates.validUntil,
          notes: estimates.notes,
          shareToken: estimates.shareToken,
          createdAt: estimates.createdAt,
          clientName: clients.name
        })
        .from(estimates)
        .leftJoin(clients, eq(estimates.clientId, clients.id))
        .where(eq(estimates.businessId, business.id))
        .orderBy(desc(estimates.createdAt));

      const formattedEstimates = rawEstimates.map((estimate: any) => {
        let items = [];
        try {
          if (typeof estimate.lineItems === 'string') {
            items = JSON.parse(estimate.lineItems);
          } else if (Array.isArray(estimate.lineItems)) {
            items = estimate.lineItems;
          }
        } catch (e) {
          items = [];
        }

        const formattedItems = Array.isArray(items) ? items.map((item: any, index: number) => ({
          id: item.id || `item_${index + 1}`,
          description: item.description || item.name || '',
          quantity: parseFloat(item.quantity || '1'),
          rate: parseFloat(item.rate || item.price || '0'),
          amount: parseFloat(item.amount || item.total || (item.quantity * item.rate) || '0')
        })) : [];

        return {
          id: estimate.id,
          businessId: estimate.businessId,
          clientId: estimate.clientId,
          title: estimate.title || '',
          description: estimate.description || '',
          items: formattedItems,
          subtotal: estimate.subtotal || '0.00',
          tax: estimate.taxAmount || '0.00',
          total: estimate.total || '0.00',
          status: estimate.status || 'draft',
          validUntil: estimate.validUntil,
          notes: estimate.notes || '',
          shareToken: estimate.shareToken || '',
          createdAt: estimate.createdAt,
          clientName: estimate.clientName || 'Unknown Client'
        };
      });

      console.log('DIRECT: Returning', formattedEstimates.length, 'schema-compliant estimates');

      res.json({
        success: true,
        data: formattedEstimates,
        message: `Found ${formattedEstimates.length} estimates for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('DIRECT GPT Estimates error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch estimates', details: error.message });
    }
  });

  app.get('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
    console.log('=== DIRECT GPT INVOICES EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('DIRECT: Processing invoices for business:', business.name);

      const rawInvoices = await db
        .select({
          id: invoices.id,
          businessId: invoices.businessId,
          clientId: invoices.clientId,
          invoiceNumber: invoices.invoiceNumber,
          title: invoices.title,
          description: invoices.description,
          lineItems: invoices.lineItems,
          subtotal: invoices.subtotal,
          taxRate: invoices.taxRate,
          taxAmount: invoices.taxAmount,
          total: invoices.total,
          status: invoices.status,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidAt,
          shareToken: invoices.shareToken,
          createdAt: invoices.createdAt,
          clientName: clients.name
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(eq(invoices.businessId, business.id))
        .orderBy(desc(invoices.createdAt));

      const formattedInvoices = rawInvoices.map((invoice: any) => {
        let items = [];
        try {
          if (typeof invoice.lineItems === 'string') {
            items = JSON.parse(invoice.lineItems);
          } else if (Array.isArray(invoice.lineItems)) {
            items = invoice.lineItems;
          }
        } catch (e) {
          items = [];
        }

        const formattedItems = Array.isArray(items) ? items.map((item: any, index: number) => ({
          id: item.id || `item_${index + 1}`,
          description: item.description || item.name || '',
          quantity: parseFloat(item.quantity || '1'),
          rate: parseFloat(item.rate || item.price || '0'),
          amount: parseFloat(item.amount || item.total || (item.quantity * item.rate) || '0')
        })) : [];

        return {
          id: invoice.id,
          businessId: invoice.businessId,
          clientId: invoice.clientId,
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title || '',
          description: invoice.description || '',
          items: formattedItems,
          subtotal: invoice.subtotal || '0.00',
          tax: invoice.taxAmount || '0.00',
          total: invoice.total || '0.00',
          status: invoice.status || 'draft',
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          shareToken: invoice.shareToken || '',
          createdAt: invoice.createdAt,
          clientName: invoice.clientName || 'Unknown Client'
        };
      });

      console.log('DIRECT: Returning', formattedInvoices.length, 'schema-compliant invoices');

      res.json({
        success: true,
        data: formattedInvoices,
        message: `Found ${formattedInvoices.length} invoices for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('DIRECT GPT Invoices error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
    }
  });

  app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== DIRECT GPT CLIENTS EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('DIRECT: Processing clients for business:', business.name);
      
      const clientsList = await storage.getClientsByBusiness(business.id);
      
      console.log('DIRECT: Returning', clientsList.length, 'clients with business verification');
      
      res.json({
        success: true,
        data: clientsList,
        message: `Found ${clientsList.length} clients for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('DIRECT GPT Clients error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
    }
  });

  app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== DIRECT GPT CREATE CLIENT EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('DIRECT: Creating client for business:', business.name);
      
      const clientData = {
        businessId: business.id,
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

      const newClient = await storage.createClient(clientData);
      
      console.log('DIRECT: Created client', newClient.name);
      
      res.json({
        success: true,
        data: newClient,
        message: `Client "${newClient.name}" created successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('DIRECT GPT Create Client error:', error);
      res.status(500).json({ success: false, error: 'Failed to create client', details: error.message });
    }
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server with direct GPT routes'
    });
  });

  console.log('DIRECT SERVER: GPT routes registered with highest priority');

  // Add error handler after routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();