import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients, jobs } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// GPT Authentication middleware
function authenticateGPT(req: any, res: any, next: any) {
  console.log('=== GPT FINAL AUTH ===');
  console.log('Method:', req.method, 'URL:', req.url);
  console.log('All Headers:', JSON.stringify(req.headers, null, 2));
  
  // Check multiple possible header variations
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['X-API-Key'] || 
                 req.headers['X-Api-Key'] ||
                 req.headers['authorization']?.replace('Bearer ', '');
  
  console.log('Extracted API Key:', apiKey ? 'Present' : 'Missing');
  
  if (!apiKey) {
    console.log('GPT FINAL: No API key provided');
    return res.status(401).json({ success: false, error: 'API key required' });
  }
  
  storage.getBusinessByApiKey(apiKey).then((business: any) => {
    if (!business) {
      console.log('GPT FINAL: Invalid API key:', apiKey);
      console.log('GPT FINAL: Database lookup returned null');
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    console.log('GPT FINAL: Business authenticated:', business.name, 'ID:', business.id);
    req.business = business;
    next();
  }).catch((error: any) => {
    console.error('GPT FINAL: Auth error:', error);
    console.error('GPT FINAL: API key being searched:', apiKey);
    res.status(500).json({ success: false, error: 'Authentication error' });
  });
}

export function registerGPTRoutes(app: Express) {
  console.log('=== REGISTERING FINAL GPT ROUTES ===');

  // GPT ESTIMATES - Schema compliant with items arrays
  app.get('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL ESTIMATES HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Processing estimates for business:', business.name);

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

      console.log('GPT FINAL: Raw estimates found:', rawEstimates.length);

      const formattedEstimates = rawEstimates.map((estimate: any) => {
        let items = [];
        try {
          if (typeof estimate.lineItems === 'string') {
            items = JSON.parse(estimate.lineItems);
          } else if (Array.isArray(estimate.lineItems)) {
            items = estimate.lineItems;
          }
        } catch (e) {
          console.log('GPT FINAL: Error parsing lineItems for estimate', estimate.id, e);
          items = [];
        }

        const formattedItems = Array.isArray(items) ? items.map((item: any, index: number) => ({
          id: item.id || `item_${index + 1}`,
          description: item.description || item.name || '',
          quantity: parseFloat(item.quantity || '1'),
          rate: parseFloat(item.rate || item.price || '0'),
          amount: parseFloat(item.amount || item.total || (parseFloat(item.quantity || '1') * parseFloat(item.rate || item.price || '0')) || '0')
        })) : [];

        console.log('GPT FINAL: Estimate', estimate.id, 'has', formattedItems.length, 'items');

        return {
          id: estimate.id,
          businessId: estimate.businessId,
          clientId: estimate.clientId,
          estimateNumber: estimate.estimateNumber,
          title: estimate.title || '',
          description: estimate.description || '',
          items: formattedItems,
          subtotal: estimate.subtotal || '0.00',
          tax: estimate.taxAmount || '0.00',
          total: estimate.total || '0.00',
          status: estimate.status || 'draft',
          validUntil: estimate.validUntil ? new Date(estimate.validUntil).toISOString() : null,
          notes: estimate.notes || '',
          shareToken: estimate.shareToken || '',
          createdAt: new Date(estimate.createdAt).toISOString(),
          clientName: estimate.clientName || 'Unknown Client'
        };
      });

      console.log('GPT FINAL: Returning', formattedEstimates.length, 'schema-compliant estimates');

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

      console.log('GPT FINAL: Response structure:', {
        success: response.success,
        dataCount: response.data.length,
        hasBusinessVerification: !!response.businessVerification,
        firstEstimateHasItems: response.data[0] ? Array.isArray(response.data[0].items) : false
      });

      res.json(response);
    } catch (error: any) {
      console.error('GPT FINAL Estimates error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch estimates', details: error.message });
    }
  });

  // GPT INVOICES - Schema compliant with items arrays
  app.get('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL INVOICES HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Processing invoices for business:', business.name);

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
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
          paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
          shareToken: invoice.shareToken || '',
          createdAt: new Date(invoice.createdAt).toISOString(),
          clientName: invoice.clientName || 'Unknown Client'
        };
      });

      console.log('GPT FINAL: Returning', formattedInvoices.length, 'schema-compliant invoices');

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
      console.error('GPT FINAL Invoices error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
    }
  });

  // GPT CLIENTS - Schema compliant
  app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL CLIENTS HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Processing clients for business:', business.name);
      
      const rawClients = await storage.getClientsByBusiness(business.id);
      
      // Format clients to ensure schema compliance
      const formattedClients = rawClients.map(client => ({
        id: client.id,
        businessId: client.businessId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
        createdAt: client.createdAt ? new Date(client.createdAt).toISOString() : new Date().toISOString()
      }));
      
      console.log('GPT FINAL: Returning', formattedClients.length, 'schema-compliant clients');
      
      res.json({
        success: true,
        data: formattedClients,
        message: `Found ${formattedClients.length} clients for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Clients error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
    }
  });

  // GPT CREATE CLIENT - Schema compliant
  app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL CREATE CLIENT HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Creating client for business:', business.name);
      
      const clientData = {
        businessId: business.id,
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

      const newClient = await storage.createClient(clientData);
      
      console.log('GPT FINAL: Created client', newClient.name);
      
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
      console.error('GPT FINAL Create Client error:', error);
      res.status(500).json({ success: false, error: 'Failed to create client', details: error.message });
    }
  });

  // GPT CREATE INVOICE - Schema compliant
  app.post('/api/gpt/invoices', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL CREATE INVOICE HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Creating invoice for business:', business.name);
      
      const invoiceData = {
        businessId: business.id,
        clientId: req.body.clientId,
        title: req.body.title,
        description: req.body.description || '',
        lineItems: JSON.stringify(req.body.items || []),
        subtotal: req.body.subtotal?.toString() || '0.00',
        taxRate: req.body.taxRate?.toString() || '0.00',
        taxAmount: req.body.tax?.toString() || '0.00',
        total: req.body.total?.toString() || '0.00',
        status: req.body.status || 'pending',
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        notes: req.body.notes || '',
        shareToken: `inv_${Math.random().toString(36).substring(2, 15)}`,
        invoiceNumber: `INV-${Date.now()}`
      };

      const newInvoice = await storage.createInvoice(invoiceData);
      
      console.log('GPT FINAL: Created invoice', newInvoice.id);
      
      res.json({
        success: true,
        data: {
          ...newInvoice,
          items: req.body.items || [],
          tax: newInvoice.taxAmount
        },
        message: `Invoice "${newInvoice.title}" created successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Create Invoice error:', error);
      res.status(500).json({ success: false, error: 'Failed to create invoice', details: error.message });
    }
  });

  // GPT UPDATE INVOICE - Schema compliant
  app.put('/api/gpt/invoices/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL UPDATE INVOICE HANDLER ===');
    
    try {
      const business = req.business;
      const invoiceId = parseInt(req.params.id);
      console.log('GPT FINAL: Updating invoice', invoiceId, 'for business:', business.name);
      
      // Verify invoice belongs to business
      const existingInvoice = await storage.getInvoiceById(invoiceId);
      if (!existingInvoice || existingInvoice.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      const updateData: any = {};
      if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.items !== undefined) updateData.lineItems = JSON.stringify(req.body.items);
      if (req.body.subtotal !== undefined) updateData.subtotal = req.body.subtotal.toString();
      if (req.body.tax !== undefined) updateData.taxAmount = req.body.tax.toString();
      if (req.body.total !== undefined) updateData.total = req.body.total.toString();
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;

      const updatedInvoice = await storage.updateInvoice(invoiceId, updateData);
      
      console.log('GPT FINAL: Updated invoice', updatedInvoice.id);
      
      res.json({
        success: true,
        data: {
          ...updatedInvoice,
          items: req.body.items || JSON.parse(String(updatedInvoice.lineItems || '[]')),
          tax: updatedInvoice.taxAmount
        },
        message: `Invoice "${updatedInvoice.title}" updated successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Update Invoice error:', error);
      res.status(500).json({ success: false, error: 'Failed to update invoice', details: error.message });
    }
  });

  // GPT GET INVOICE BY ID - Schema compliant
  app.get('/api/gpt/invoices/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL GET INVOICE BY ID HANDLER ===');
    
    try {
      const business = req.business;
      const invoiceId = parseInt(req.params.id);
      console.log('GPT FINAL: Getting invoice', invoiceId, 'for business:', business.name);
      
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Format invoice items
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

      const formattedInvoice = {
        id: invoice.id,
        businessId: invoice.businessId,
        clientId: invoice.clientId,
        title: invoice.title || '',
        description: invoice.description || '',
        items: formattedItems,
        subtotal: invoice.subtotal || '0.00',
        tax: invoice.taxAmount || '0.00',
        total: invoice.total || '0.00',
        status: invoice.status || 'draft',
        dueDate: invoice.dueDate,
        shareToken: invoice.shareToken || '',
        createdAt: invoice.createdAt
      };
      
      console.log('GPT FINAL: Returning invoice', invoice.id);
      
      res.json({
        success: true,
        data: formattedInvoice,
        message: `Invoice "${invoice.title}" retrieved successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Get Invoice error:', error);
      res.status(500).json({ success: false, error: 'Failed to get invoice', details: error.message });
    }
  });

  // GPT DELETE INVOICE - Schema compliant
  app.delete('/api/gpt/invoices/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL DELETE INVOICE HANDLER ===');
    
    try {
      const business = req.business;
      const invoiceId = parseInt(req.params.id);
      console.log('GPT FINAL: Deleting invoice', invoiceId, 'for business:', business.name);
      
      // Verify invoice belongs to business
      const existingInvoice = await storage.getInvoiceById(invoiceId);
      if (!existingInvoice || existingInvoice.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      await storage.deleteInvoice(invoiceId);
      
      console.log('GPT FINAL: Deleted invoice', invoiceId);
      
      res.json({
        success: true,
        message: `Invoice "${existingInvoice.title}" deleted successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Delete Invoice error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete invoice', details: error.message });
    }
  });

  // GPT JOBS - Schema compliant
  app.get('/api/gpt/jobs', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL JOBS HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Processing jobs for business:', business.name);

      const rawJobs = await db
        .select({
          id: jobs.id,
          businessId: jobs.businessId,
          clientId: jobs.clientId,
          assignedUserId: jobs.assignedUserId,
          title: jobs.title,
          description: jobs.description,
          address: jobs.address,
          scheduledStart: jobs.scheduledStart,
          scheduledEnd: jobs.scheduledEnd,
          status: jobs.status,
          priority: jobs.priority,
          jobType: jobs.jobType,
          estimatedAmount: jobs.estimatedAmount,
          notes: jobs.notes,
          isRecurring: jobs.isRecurring,
          recurringFrequency: jobs.recurringFrequency,
          recurringEndDate: jobs.recurringEndDate,
          createdAt: jobs.createdAt,
          clientName: clients.name
        })
        .from(jobs)
        .leftJoin(clients, eq(jobs.clientId, clients.id))
        .where(eq(jobs.businessId, business.id))
        .orderBy(desc(jobs.createdAt));

      // Format jobs to ensure schema compliance
      const formattedJobs = rawJobs.map(job => ({
        id: job.id,
        businessId: job.businessId,
        clientId: job.clientId,
        assignedUserId: job.assignedUserId,
        title: job.title,
        description: job.description,
        address: job.address,
        scheduledStart: job.scheduledStart ? new Date(job.scheduledStart).toISOString() : null,
        scheduledEnd: job.scheduledEnd ? new Date(job.scheduledEnd).toISOString() : null,
        status: job.status,
        priority: job.priority,
        jobType: job.jobType,
        estimatedAmount: job.estimatedAmount,
        notes: job.notes,
        isRecurring: job.isRecurring,
        recurringFrequency: job.recurringFrequency,
        recurringEndDate: job.recurringEndDate ? new Date(job.recurringEndDate).toISOString() : null,
        createdAt: new Date(job.createdAt).toISOString(),
        clientName: job.clientName
      }));

      console.log('GPT FINAL: Returning', formattedJobs.length, 'schema-compliant jobs');

      res.json({
        success: true,
        data: formattedJobs,
        message: `Found ${formattedJobs.length} jobs for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Jobs error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch jobs', details: error.message });
    }
  });

  // GPT CREATE JOB - Schema compliant
  app.post('/api/gpt/jobs', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL CREATE JOB HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Creating job for business:', business.name);
      
      const jobData: any = {
        businessId: business.id,
        clientId: req.body.clientId,
        assignedUserId: req.body.assignedUserId || null,
        title: req.body.title,
        description: req.body.description || '',
        address: req.body.address || '',
        scheduledStart: req.body.scheduledStart ? new Date(req.body.scheduledStart) : null,
        scheduledEnd: req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null,
        status: req.body.status || 'scheduled',
        priority: req.body.priority || 'medium',
        jobType: req.body.jobType || '',
        estimatedAmount: req.body.estimatedAmount?.toString() || '0.00',
        notes: req.body.notes || ''
      };

      const newJob = await storage.createJob(jobData as any);
      
      console.log('GPT FINAL: Created job', newJob.id);
      
      // Format job response for schema compliance
      const formattedJob = {
        ...newJob,
        scheduledStart: newJob.scheduledStart ? new Date(newJob.scheduledStart).toISOString() : null,
        scheduledEnd: newJob.scheduledEnd ? new Date(newJob.scheduledEnd).toISOString() : null,
        recurringEndDate: newJob.recurringEndDate ? new Date(newJob.recurringEndDate).toISOString() : null,
        createdAt: new Date(newJob.createdAt).toISOString()
      };

      res.json({
        success: true,
        data: formattedJob,
        message: `Job "${newJob.title}" created successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Create Job error:', error);
      res.status(500).json({ success: false, error: 'Failed to create job', details: error.message });
    }
  });

  // GPT UPDATE JOB - Schema compliant
  app.put('/api/gpt/jobs/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL UPDATE JOB HANDLER ===');
    
    try {
      const business = req.business;
      const jobId = parseInt(req.params.id);
      console.log('GPT FINAL: Updating job', jobId, 'for business:', business.name);
      
      // Verify job belongs to business
      const existingJob = await storage.getJobById(jobId);
      if (!existingJob || existingJob.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      const updateData: any = {};
      if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId;
      if (req.body.assignedUserId !== undefined) updateData.assignedUserId = req.body.assignedUserId;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      if (req.body.scheduledStart !== undefined) updateData.scheduledStart = req.body.scheduledStart ? new Date(req.body.scheduledStart) : null;
      if (req.body.scheduledEnd !== undefined) updateData.scheduledEnd = req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.priority !== undefined) updateData.priority = req.body.priority;
      if (req.body.jobType !== undefined) updateData.jobType = req.body.jobType;
      if (req.body.estimatedAmount !== undefined) updateData.estimatedAmount = req.body.estimatedAmount.toString();
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;

      const updatedJob = await storage.updateJob(jobId, updateData);
      
      console.log('GPT FINAL: Updated job', updatedJob.id);
      
      res.json({
        success: true,
        data: updatedJob,
        message: `Job "${updatedJob.title}" updated successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Update Job error:', error);
      res.status(500).json({ success: false, error: 'Failed to update job', details: error.message });
    }
  });

  // GPT GET JOB BY ID - Schema compliant
  app.get('/api/gpt/jobs/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL GET JOB BY ID HANDLER ===');
    
    try {
      const business = req.business;
      const jobId = parseInt(req.params.id);
      console.log('GPT FINAL: Getting job', jobId, 'for business:', business.name);
      
      const job = await storage.getJobById(jobId);
      if (!job || job.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      
      console.log('GPT FINAL: Returning job', job.id);
      
      res.json({
        success: true,
        data: job,
        message: `Job "${job.title}" retrieved successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Get Job error:', error);
      res.status(500).json({ success: false, error: 'Failed to get job', details: error.message });
    }
  });

  // GPT DELETE JOB - Schema compliant
  app.delete('/api/gpt/jobs/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL DELETE JOB HANDLER ===');
    
    try {
      const business = req.business;
      const jobId = parseInt(req.params.id);
      console.log('GPT FINAL: Deleting job', jobId, 'for business:', business.name);
      
      // Verify job belongs to business
      const existingJob = await storage.getJobById(jobId);
      if (!existingJob || existingJob.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      await storage.deleteJob(jobId);
      
      console.log('GPT FINAL: Deleted job', jobId);
      
      res.json({
        success: true,
        message: `Job "${existingJob.title}" deleted successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Delete Job error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete job', details: error.message });
    }
  });

  // GPT CREATE ESTIMATE - Schema compliant
  app.post('/api/gpt/estimates', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL CREATE ESTIMATE HANDLER ===');
    
    try {
      const business = req.business;
      console.log('GPT FINAL: Creating estimate for business:', business.name);
      
      const estimateData = {
        businessId: business.id,
        clientId: req.body.clientId,
        title: req.body.title,
        description: req.body.description || '',
        lineItems: JSON.stringify(req.body.items || []),
        subtotal: req.body.subtotal?.toString() || '0.00',
        taxRate: req.body.taxRate?.toString() || '0.00',
        taxAmount: req.body.tax?.toString() || '0.00',
        total: req.body.total?.toString() || '0.00',
        status: req.body.status || 'draft',
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
        notes: req.body.notes || '',
        shareToken: `est_${Math.random().toString(36).substring(2, 15)}`,
        estimateNumber: `EST-${Date.now()}`
      };

      const newEstimate = await storage.createEstimate(estimateData);
      
      console.log('GPT FINAL: Created estimate', newEstimate.id);
      
      res.json({
        success: true,
        data: {
          ...newEstimate,
          items: req.body.items || [],
          tax: newEstimate.taxAmount
        },
        message: `Estimate "${newEstimate.title}" created successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Create Estimate error:', error);
      res.status(500).json({ success: false, error: 'Failed to create estimate', details: error.message });
    }
  });

  // GPT UPDATE ESTIMATE - Schema compliant
  app.put('/api/gpt/estimates/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL UPDATE ESTIMATE HANDLER ===');
    
    try {
      const business = req.business;
      const estimateId = parseInt(req.params.id);
      console.log('GPT FINAL: Updating estimate', estimateId, 'for business:', business.name);
      
      // Verify estimate belongs to business
      const existingEstimate = await storage.getEstimateById(estimateId);
      if (!existingEstimate || existingEstimate.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Estimate not found' });
      }

      const updateData: any = {};
      if (req.body.clientId !== undefined) updateData.clientId = req.body.clientId;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.items !== undefined) updateData.lineItems = JSON.stringify(req.body.items);
      if (req.body.subtotal !== undefined) updateData.subtotal = req.body.subtotal.toString();
      if (req.body.tax !== undefined) updateData.taxAmount = req.body.tax.toString();
      if (req.body.total !== undefined) updateData.total = req.body.total.toString();
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.validUntil !== undefined) updateData.validUntil = req.body.validUntil ? new Date(req.body.validUntil) : undefined;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;

      const updatedEstimate = await storage.updateEstimate(estimateId, updateData);
      
      console.log('GPT FINAL: Updated estimate', updatedEstimate.id);
      
      res.json({
        success: true,
        data: {
          ...updatedEstimate,
          items: req.body.items || JSON.parse(String(updatedEstimate.lineItems || '[]')),
          tax: updatedEstimate.taxAmount
        },
        message: `Estimate "${updatedEstimate.title}" updated successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Update Estimate error:', error);
      res.status(500).json({ success: false, error: 'Failed to update estimate', details: error.message });
    }
  });

  // GPT GET ESTIMATE BY ID - Schema compliant
  app.get('/api/gpt/estimates/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL GET ESTIMATE BY ID HANDLER ===');
    
    try {
      const business = req.business;
      const estimateId = parseInt(req.params.id);
      console.log('GPT FINAL: Getting estimate', estimateId, 'for business:', business.name);
      
      const estimate = await storage.getEstimateById(estimateId);
      if (!estimate || estimate.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Estimate not found' });
      }

      // Format estimate items
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

      const formattedEstimate = {
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
        shareToken: estimate.shareToken || '',
        createdAt: estimate.createdAt
      };
      
      console.log('GPT FINAL: Returning estimate', estimate.id);
      
      res.json({
        success: true,
        data: formattedEstimate,
        message: `Estimate "${estimate.title}" retrieved successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Get Estimate error:', error);
      res.status(500).json({ success: false, error: 'Failed to get estimate', details: error.message });
    }
  });

  // GPT DELETE ESTIMATE - Schema compliant
  app.delete('/api/gpt/estimates/:id', authenticateGPT, async (req: any, res: any) => {
    console.log('=== GPT FINAL DELETE ESTIMATE HANDLER ===');
    
    try {
      const business = req.business;
      const estimateId = parseInt(req.params.id);
      console.log('GPT FINAL: Deleting estimate', estimateId, 'for business:', business.name);
      
      // Verify estimate belongs to business
      const existingEstimate = await storage.getEstimateById(estimateId);
      if (!existingEstimate || existingEstimate.businessId !== business.id) {
        return res.status(404).json({ success: false, error: 'Estimate not found' });
      }

      await storage.deleteEstimate(estimateId);
      
      console.log('GPT FINAL: Deleted estimate', estimateId);
      
      res.json({
        success: true,
        message: `Estimate "${existingEstimate.title}" deleted successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT FINAL Delete Estimate error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete estimate', details: error.message });
    }
  });

  console.log('GPT FINAL: All schema-compliant routes registered');
}