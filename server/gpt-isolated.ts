import express from "express";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for GPT access
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

// GPT Authentication
function authenticateGPT(req: any, res: any, next: any) {
  console.log('=== ISOLATED GPT AUTH ===');
  console.log('Method:', req.method, 'URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    console.log('ISOLATED: No API key provided');
    return res.status(401).json({ success: false, error: 'API key required' });
  }
  
  storage.getBusinessByApiKey(apiKey).then((business: any) => {
    if (!business) {
      console.log('ISOLATED: Invalid API key');
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    console.log('ISOLATED: Business authenticated:', business.name);
    req.business = business;
    next();
  }).catch((error: any) => {
    console.error('ISOLATED: Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  });
}

// ISOLATED GPT ESTIMATES ROUTE
app.get('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
  console.log('=== ISOLATED GPT ESTIMATES EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('ISOLATED: Processing estimates for business:', business.name);

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

    console.log('ISOLATED: Raw estimates found:', rawEstimates.length);

    const formattedEstimates = rawEstimates.map((estimate: any) => {
      let items = [];
      try {
        if (typeof estimate.lineItems === 'string') {
          items = JSON.parse(estimate.lineItems);
        } else if (Array.isArray(estimate.lineItems)) {
          items = estimate.lineItems;
        }
      } catch (e) {
        console.log('ISOLATED: Error parsing lineItems for estimate', estimate.id, e);
        items = [];
      }

      const formattedItems = Array.isArray(items) ? items.map((item: any, index: number) => ({
        id: item.id || `item_${index + 1}`,
        description: item.description || item.name || '',
        quantity: parseFloat(item.quantity || '1'),
        rate: parseFloat(item.rate || item.price || '0'),
        amount: parseFloat(item.amount || item.total || (parseFloat(item.quantity || '1') * parseFloat(item.rate || item.price || '0')) || '0')
      })) : [];

      console.log('ISOLATED: Estimate', estimate.id, 'has', formattedItems.length, 'items');

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

    console.log('ISOLATED: Returning', formattedEstimates.length, 'schema-compliant estimates');

    const response = {
      success: true,
      data: formattedEstimates,
      message: `Found ${formattedEstimates.length} estimates for ${business.name}`,
      businessVerification: {
        businessName: business.name,
        businessId: business.id,
        dataSource: "AUTHENTIC_DATABASE",
        timestamp: new Date().toISOString()
      }
    };

    console.log('ISOLATED: Response structure:', {
      success: response.success,
      dataCount: response.data.length,
      hasBusinessVerification: !!response.businessVerification,
      firstEstimateHasItems: response.data[0] ? Array.isArray(response.data[0].items) : false
    });

    res.json(response);
  } catch (error: any) {
    console.error('ISOLATED GPT Estimates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estimates', details: error.message });
  }
});

// ISOLATED GPT INVOICES ROUTE
app.get('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
  console.log('=== ISOLATED GPT INVOICES EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('ISOLATED: Processing invoices for business:', business.name);

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
        amount: parseFloat(item.amount || item.total || (parseFloat(item.quantity || '1') * parseFloat(item.rate || item.price || '0')) || '0')
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

    console.log('ISOLATED: Returning', formattedInvoices.length, 'schema-compliant invoices');

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
    console.error('ISOLATED GPT Invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
  }
});

// ISOLATED GPT CLIENTS ROUTE
app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
  console.log('=== ISOLATED GPT CLIENTS EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('ISOLATED: Processing clients for business:', business.name);
    
    const clientsList = await storage.getClientsByBusiness(business.id);
    
    console.log('ISOLATED: Returning', clientsList.length, 'clients with business verification');
    
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
    console.error('ISOLATED GPT Clients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
  }
});

// ISOLATED GPT CREATE CLIENT ROUTE
app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
  console.log('=== ISOLATED GPT CREATE CLIENT EXECUTING ===');
  
  try {
    const business = req.business;
    console.log('ISOLATED: Creating client for business:', business.name);
    
    const clientData = {
      businessId: business.id,
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone || null,
      address: req.body.address || null,
      notes: req.body.notes || null
    };

    const newClient = await storage.createClient(clientData);
    
    console.log('ISOLATED: Created client', newClient.name);
    
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
    console.error('ISOLATED GPT Create Client error:', error);
    res.status(500).json({ success: false, error: 'Failed to create client', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'BizWorx GPT isolated server'
  });
});

console.log('ISOLATED GPT SERVER: Starting on port 3001 with schema-compliant routes');

const port = 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Isolated GPT server running on port ${port}`);
});

export default app;