import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "bizworx-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Request logging middleware
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

// GPT Authentication middleware
function authenticateGPT(req: any, res: any, next: any) {
  console.log('=== FINAL GPT AUTH ===');
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    console.log('FINAL: No API key provided');
    return res.status(401).json({ success: false, error: 'API key required' });
  }
  
  storage.getBusinessByApiKey(apiKey).then((business: any) => {
    if (!business) {
      console.log('FINAL: Invalid API key');
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    console.log('FINAL: Business authenticated:', business.name);
    req.business = business;
    next();
  }).catch((error: any) => {
    console.error('FINAL: Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  });
}

// PRIORITY GPT ROUTES - REGISTERED FIRST
app.get('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
  console.log('=== FINAL GPT ESTIMATES HANDLER EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('FINAL: Processing estimates for business:', business.name);

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

    console.log('FINAL: Returning', formattedEstimates.length, 'schema-compliant estimates');

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
    console.error('FINAL GPT Estimates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estimates', details: error.message });
  }
});

app.get('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
  console.log('=== FINAL GPT INVOICES HANDLER EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('FINAL: Processing invoices for business:', business.name);

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

    console.log('FINAL: Returning', formattedInvoices.length, 'schema-compliant invoices');

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
    console.error('FINAL GPT Invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
  }
});

app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
  console.log('=== FINAL GPT CLIENTS HANDLER EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('FINAL: Processing clients for business:', business.name);
    
    const clientsList = await storage.getClientsByBusiness(business.id);
    
    console.log('FINAL: Returning', clientsList.length, 'clients with business verification');
    
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
    console.error('FINAL GPT Clients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
  }
});

app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
  console.log('=== FINAL GPT CREATE CLIENT HANDLER EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('FINAL: Creating client for business:', business.name);
    
    const clientData = {
      businessId: business.id,
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone || null,
      address: req.body.address || null,
      notes: req.body.notes || null
    };

    const newClient = await storage.createClient(clientData);
    
    console.log('FINAL: Created client', newClient.name);
    
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
    console.error('FINAL GPT Create Client error:', error);
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

console.log('FINAL SERVER: GPT routes registered with highest priority');

if (import.meta.env.PROD) {
  serveStatic(app);
} else {
  setupVite(app);
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
});

const port = 5000;
const server = app.listen(port, "0.0.0.0", () => {
  log(`Server running on port ${port}`);
});

export default server;