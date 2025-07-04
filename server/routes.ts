import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerGPTRoutes } from "./gpt-routes-final";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients, jobs, services, timeEntries, users } from "@shared/schema";
import { eq, desc, and, gte, lte, sql, isNull } from "drizzle-orm";
export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register GPT routes first
  console.log('Registering GPT routes...');
  registerGPTRoutes(app);
  console.log('GPT routes registered successfully');

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server running'
    });
  });

  // ChatGPT Proxy endpoints - integrated into main app
  app.get('/proxy/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BizWorx ChatGPT Proxy',
      timestamp: new Date().toISOString()
    });
  });

  // Proxy endpoints for ChatGPT Custom GPT integration
  app.all('/proxy/api/gpt/*', async (req, res) => {
    try {
      console.log(`[PROXY] ${req.method} ${req.originalUrl}`);
      console.log(`[PROXY] Body:`, JSON.stringify(req.body, null, 2));
      
      // Extract API key from request body
      const { api_key, ...bodyWithoutKey } = req.body || {};
      
      if (!api_key) {
        return res.status(400).json({
          success: false,
          error: 'API key required. Please provide your BizWorx API key in the request body as "api_key"'
        });
      }

      console.log(`[PROXY] Using API key: ${api_key.substring(0, 8)}...`);
      
      // Get the target path by removing /proxy prefix
      const targetPath = req.originalUrl.replace('/proxy', '');
      console.log(`[PROXY] Forwarding to: ${targetPath}`);
      
      // Make internal request to the actual GPT endpoint
      const fetch = (await import('node-fetch')).default;
      const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
      const fullUrl = `${baseUrl}${targetPath}`;
      
      console.log(`[PROXY] Full URL: ${fullUrl}`);
      
      const fetchOptions: any = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': api_key
        }
      };
      
      // Add body for non-GET requests
      if (req.method !== 'GET' && bodyWithoutKey && Object.keys(bodyWithoutKey).length > 0) {
        fetchOptions.body = JSON.stringify(bodyWithoutKey);
      }
      
      console.log(`[PROXY] Fetch options:`, { ...fetchOptions, headers: { ...fetchOptions.headers, 'X-API-Key': '***' } });
      
      const response = await fetch(fullUrl, fetchOptions);
      const data = await response.json();
      
      console.log(`[PROXY] Response status: ${response.status}`);
      
      return res.status(response.status).json(data);
      
    } catch (error) {
      console.error('[PROXY] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Proxy server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Business registration endpoint - matches frontend expectation
  app.post("/api/auth/business/register", async (req, res) => {
    try {
      console.log('Registration request body:', JSON.stringify(req.body, null, 2));
      const { name, businessName, email, password, phone, address, firebaseUid } = req.body;
      const businessNameToUse = name || businessName;
      console.log('Extracted fields:', { name, businessName, businessNameToUse, email, password: password ? '[SET]' : '[MISSING]', phone, address, firebaseUid });
      
      if (!businessNameToUse) {
        return res.status(400).json({ success: false, error: "Business name is required" });
      }
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      if (!firebaseUid) {
        return res.status(400).json({ success: false, error: "Firebase UID is required" });
      }
      
      // Check if business already exists
      const existingBusiness = await storage.getBusinessByEmail(email);
      if (existingBusiness) {
        return res.status(400).json({ success: false, error: "Business with this email already exists" });
      }

      const businessData = {
        name: businessNameToUse,
        email,
        password: password || null, // Keep for backward compatibility
        firebaseUid, // Store Firebase UID
        phone: phone || null,
        address: address || null,
        apiKey: `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
      };
      console.log('Business data to create:', JSON.stringify(businessData, null, 2));
      console.log('Business name being passed:', businessData.name);

      const business = await storage.createBusiness(businessData);
      
      // Set session for setup mode - business exists but no admin user yet
      (req.session as any).businessId = business.id;
      (req.session as any).setupMode = true;
      (req.session as any).firebaseUid = firebaseUid;

      res.json({ 
        success: true, 
        business,
        setupMode: true,
        message: "Business registered successfully"
      });
    } catch (error: any) {
      console.error('Business registration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Business login endpoint - for existing businesses
  app.post("/api/auth/business/login", async (req, res) => {
    try {
      const { email, password, firebaseUid } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ success: false, error: "Firebase UID is required" });
      }
      
      const business = await storage.getBusinessByEmail(email);
      if (!business) {
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }
      
      // Verify Firebase UID matches the business
      if (business.firebaseUid !== firebaseUid) {
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      // Check if business has any users (admin setup completed)
      const users = await storage.getUsersByBusiness(business.id);
      const hasAdmin = users.some(user => user.role === 'owner' || user.role === 'admin');

      (req.session as any).businessId = business.id;
      (req.session as any).firebaseUid = firebaseUid;

      if (hasAdmin) {
        // Business setup is complete, user can proceed to PIN login
        res.json({ 
          success: true, 
          business,
          message: "Business login successful"
        });
      } else {
        // Business exists but no admin user created yet - enter setup mode
        (req.session as any).setupMode = true;
        res.json({ 
          success: true, 
          business,
          setupMode: true,
          message: "Business login successful"
        });
      }
    } catch (error: any) {
      console.error('Business login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin setup endpoint - creates the first admin user after business registration
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const { firstName, lastName, pin } = req.body;
      const businessId = (req.session as any).businessId;

      if (!businessId || !(req.session as any).setupMode) {
        return res.status(401).json({ success: false, error: "Invalid setup session" });
      }

      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ success: false, error: "Business not found" });
      }

      // Create admin user with correct schema fields
      const userData = {
        businessId,
        username: `${firstName}.${lastName}`.toLowerCase(),
        firstName,
        lastName,
        email: business.email,
        role: 'owner' as const,
        pin,
        phone: null
      };

      const user = await storage.createUser(userData);

      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      delete (req.session as any).setupMode;

      res.json({ 
        success: true, 
        user,
        business,
        message: "Setup completed successfully"
      });
    } catch (error: any) {
      console.error('Setup error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User PIN login endpoint - for team members after business login
  app.post("/api/auth/user/login", async (req, res) => {
    try {
      const { pin } = req.body;
      const businessId = (req.session as any).businessId;

      if (!businessId) {
        return res.status(401).json({ success: false, error: "No business session found" });
      }

      const user = await storage.getUserByPin(businessId, pin);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid PIN" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;

      res.json({ 
        success: true, 
        user,
        message: "Login successful"
      });
    } catch (error: any) {
      console.error('User login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const businessId = (req.session as any).businessId;

      if (!userId || !businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      const business = await storage.getBusinessById(businessId);

      if (!user || !business) {
        return res.status(404).json({ success: false, error: "User or business not found" });
      }

      res.json({ 
        success: true, 
        user,
        business,
        isAuthenticated: true
      });
    } catch (error: any) {
      console.error('Get me error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Client management routes
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
        businessId: (req.session as any).businessId,
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

      const client = await storage.createClient(clientData);
      res.json({ success: true, data: client });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const client = await storage.getClientById(clientId);
      
      if (!client || client.businessId !== (req.session as any).businessId) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }

      res.json({ success: true, data: client });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const existingClient = await storage.getClientById(clientId);
      
      if (!existingClient || existingClient.businessId !== (req.session as any).businessId) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }

      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;

      const updatedClient = await storage.updateClient(clientId, updateData);
      res.json({ success: true, data: updatedClient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const clientId = parseInt(req.params.id);
      const existingClient = await storage.getClientById(clientId);
      
      if (!existingClient || existingClient.businessId !== (req.session as any).businessId) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }

      await storage.deleteClient(clientId);
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Job management routes
  app.get("/api/jobs", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const clientId = req.query.clientId;
      let jobs;
      
      if (clientId) {
        jobs = await storage.getJobsByClient(parseInt(clientId as string));
        // Filter to ensure business ownership
        jobs = jobs.filter((job: any) => job.businessId === (req.session as any).businessId);
      } else {
        jobs = await storage.getJobsByBusiness((req.session as any).businessId);
      }
      
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const jobData = {
        businessId: (req.session as any).businessId,
        clientId: req.body.clientId,
        assignedUserId: req.body.assignedUserId || null,
        title: req.body.title,
        description: req.body.description || null,
        address: req.body.address || null,
        scheduledStart: req.body.scheduledStart ? new Date(req.body.scheduledStart) : null,
        scheduledEnd: req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null,
        status: req.body.status || 'scheduled',
        priority: req.body.priority || 'medium',
        jobType: req.body.jobType || 'service',
        estimatedAmount: req.body.estimatedAmount || null,
        notes: req.body.notes || null
      };

      const job = await storage.createJob(jobData);
      res.json({ success: true, data: job });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
      if (!job || job.businessId !== (req.session as any).businessId) {
        return res.status(404).json({ success: false, error: "Job not found" });
      }

      res.json({ success: true, data: job });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Service management routes
  app.get("/api/services", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const services = await storage.getServicesByBusiness((req.session as any).businessId);
      res.json({ success: true, data: services });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Estimate management routes
  app.get("/api/estimates", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const estimates = await storage.getEstimatesByBusiness((req.session as any).businessId);
      res.json({ success: true, data: estimates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Invoice management routes
  app.get("/api/invoices", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const clientId = req.query.clientId;
      let invoices;
      
      if (clientId) {
        invoices = await storage.getInvoicesByClient(parseInt(clientId as string));
        // Filter to ensure business ownership
        invoices = invoices.filter((invoice: any) => invoice.businessId === (req.session as any).businessId);
      } else {
        invoices = await storage.getInvoicesByBusiness((req.session as any).businessId);
      }
      
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice || invoice.businessId !== (req.session as any).businessId) {
        return res.status(404).json({ success: false, error: "Invoice not found" });
      }

      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Team management routes
  app.get("/api/team", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const teamMembers = await storage.getUsersByBusiness((req.session as any).businessId);
      res.json({ success: true, data: teamMembers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/team", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const userData = {
        businessId: (req.session as any).businessId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        pin: req.body.pin,
        role: req.body.role || 'member',
        email: req.body.email || null,
        phone: req.body.phone || null,
        isActive: true
      };

      const user = await storage.createUser(userData);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Time tracking routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const timeEntries = await storage.getTimeEntriesByUser((req.session as any).userId);
      res.json({ success: true, data: timeEntries });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // API Key Management Routes
  app.get("/api/business/api-key", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const business = await storage.getBusinessById((req.session as any).businessId);
      if (!business) {
        return res.status(404).json({ success: false, error: "Business not found" });
      }

      res.json({ 
        success: true, 
        data: { 
          apiKey: business.apiKey || null,
          hasApiKey: !!business.apiKey 
        } 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/business/api-key", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const businessId = (req.session as any).businessId;
      
      // Generate new API key with proper format
      const newApiKey = `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
      
      // Update the business with the new API key
      await storage.updateBusiness(businessId, { apiKey: newApiKey });
      
      // Verify the update worked by fetching the business
      const updatedBusiness = await storage.getBusinessById(businessId);
      
      if (!updatedBusiness || updatedBusiness.apiKey !== newApiKey) {
        throw new Error("Failed to save API key to database");
      }
      
      res.json({ 
        success: true, 
        data: { apiKey: newApiKey },
        message: "API key generated successfully" 
      });
    } catch (error: any) {
      console.error('API key generation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/business/api-key", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const businessId = (req.session as any).businessId;
      await storage.updateBusiness(businessId, { apiKey: null });
      
      res.json({ 
        success: true, 
        message: "API key revoked successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const PORT = Number(process.env.PORT) || 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  return httpServer;
}