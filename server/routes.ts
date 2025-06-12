import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerGPTRoutes } from "./gpt-routes-final";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients, jobs, services, timeEntries, users } from "@shared/schema";
import { eq, desc, and, gte, lte, sql, isNull } from "drizzle-orm";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure passport local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'pin'
    },
    async (email: string, pin: string, done: any) => {
      try {
        const business = await storage.getBusinessByEmail(email);
        if (!business) {
          return done(null, false, { message: 'Business not found' });
        }

        const user = await storage.getUserByPin(business.id, pin);
        if (!user) {
          return done(null, false, { message: 'Invalid PIN' });
        }

        return done(null, { ...user, businessId: business.id });
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: any, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // =============================================================================
  // SOLUTION: Register ONLY schema-compliant GPT routes - eliminates duplicates
  // =============================================================================
  
  console.log('=== REGISTERING CLEAN GPT ROUTES FIRST ===');
  registerGPTRoutes(app);
  console.log('=== GPT ROUTES REGISTERED SUCCESSFULLY ===');

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server running with clean GPT routes'
    });
  });

  // Authentication routes
  app.post("/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.post("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ success: false, error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ success: true, user: req.user });
    } else {
      res.status(401).json({ success: false, error: "Not authenticated" });
    }
  });

  // Business setup routes
  app.post("/api/business/setup", async (req, res) => {
    try {
      const businessData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        address: req.body.address || null,
        password: req.body.ownerPin, // Use owner PIN as business password
        apiKey: `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
      };

      const business = await storage.createBusiness(businessData);
      
      const ownerName = req.body.ownerName || 'Business Owner';
      const nameParts = ownerName.split(' ');
      const userData = {
        businessId: business.id,
        username: req.body.email, // Use email as username
        firstName: nameParts[0] || 'Business',
        lastName: nameParts.slice(1).join(' ') || 'Owner',
        email: req.body.email,
        pin: req.body.ownerPin,
        role: 'owner'
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

      const updateData = {
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

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
      
      const jobs = await storage.getJobsByBusiness((req.session as any).businessId);
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
      
      const invoices = await storage.getInvoicesByBusiness((req.session as any).businessId);
      res.json({ success: true, data: invoices });
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
      
      const timeEntries = await storage.getTimeEntriesByBusiness((req.session as any).businessId);
      res.json({ success: true, data: timeEntries });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}