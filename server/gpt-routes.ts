import type { Express } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// GPT Authentication function
function authenticateGPT(req: any, res: any, next: any) {
  console.log('=== GPT AUTHENTICATION CALLED ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  const apiKey = req.headers['x-api-key'];
  console.log('API Key present:', !!apiKey);
  if (!apiKey) return res.status(401).json({ success: false, error: 'API key required' });
  
  storage.getBusinessByApiKey(apiKey).then((business: any) => {
    if (!business) return res.status(401).json({ success: false, error: 'Invalid API key' });
    console.log('Business authenticated:', business.name);
    req.business = business;
    req.gptAuth = true;
    next();
  }).catch((error: any) => res.status(500).json({ success: false, error: 'Authentication error' }));
}

export function registerGPTRoutes(app: Express) {
  console.log('Registering GPT routes...');

  // GPT Estimates endpoint
  app.get('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT ESTIMATES ROUTE EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('Processing estimates for business:', business.name);

      // Get estimates with client information
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

      // Format estimates to match ChatGPT schema expectations
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

      console.log(`Returning ${formattedEstimates.length} formatted estimates`);

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
      console.error('GPT Estimates error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch estimates', details: error.message });
    }
  });

  // GPT Invoices endpoint
  app.get('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT INVOICES ROUTE EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('Processing invoices for business:', business.name);

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

      console.log(`Returning ${formattedInvoices.length} formatted invoices`);

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
      console.error('GPT Invoices error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
    }
  });

  // GPT Clients endpoint
  app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT CLIENTS ROUTE EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('Processing clients for business:', business.name);
      
      const clientsList = await storage.getClientsByBusiness(business.id);
      
      console.log(`Returning ${clientsList.length} clients`);
      
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
      console.error('GPT Clients error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
    }
  });

  // GPT Create Client endpoint
  app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT CREATE CLIENT ROUTE EXECUTING ===');
    
    try {
      const business = req.business;
      console.log('Creating client for business:', business.name);
      
      const clientData = {
        businessId: business.id,
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

      const newClient = await storage.createClient(clientData);
      
      console.log('Client created:', newClient.name);
      
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
      console.error('GPT Create Client error:', error);
      res.status(500).json({ success: false, error: 'Failed to create client', details: error.message });
    }
  });

  console.log('GPT routes registered successfully');
}