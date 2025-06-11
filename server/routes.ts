import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertBusinessSchema, insertUserSchema, insertClientSchema, insertServiceSchema, insertJobSchema, insertInvoiceSchema, insertEstimateSchema, insertTimeEntrySchema, clients, jobs, businesses } from "@shared/schema";
import { z } from "zod";
import express from "express";
import path from "path";
import { eq } from "drizzle-orm";

// Authentication middleware
const authenticateSession = (req: any, res: any, next: any) => {
  if (!req.session?.businessId || !req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// API Key authentication middleware for external services
const authenticateApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  try {
    const business = await storage.getBusinessByApiKey(apiKey);
    if (!business) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.businessId = business.id;
    req.apiKeyAuth = true;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid API key" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const business = await storage.getBusinessById(user.businessId);
      if (!business) {
        return res.status(500).json({ error: "Business not found" });
      }

      req.session.userId = user.id;
      req.session.businessId = user.businessId;
      req.session.userRole = user.role;

      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          businessId: user.businessId
        },
        business: {
          id: business.id,
          name: business.name,
          industry: business.industry
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", authenticateSession, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      const business = await storage.getBusinessById(req.session.businessId);
      
      if (!user || !business) {
        return res.status(404).json({ error: "User or business not found" });
      }

      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          businessId: user.businessId
        },
        business: {
          id: business.id,
          name: business.name,
          industry: business.industry
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', authenticateSession, async (req, res) => {
    try {
      const businessId = req.session.businessId;
      
      const [clients, jobs, invoices] = await Promise.all([
        storage.getClientsByBusiness(businessId),
        storage.getJobsByBusiness(businessId),
        storage.getInvoicesByBusiness(businessId)
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysJobs = jobs.filter((job: any) => {
        if (!job.scheduledStart) return false;
        const jobDate = new Date(job.scheduledStart);
        return jobDate >= today && jobDate < tomorrow;
      });

      const recentInvoices = invoices
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (parseFloat(inv.total || '0') || 0), 0);

      const teamMembers = await storage.getUsersByBusiness(businessId);

      res.json({
        revenue: {
          total: totalRevenue,
          count: invoices.filter((inv: any) => inv.status === 'paid').length
        },
        todaysJobs: todaysJobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          client: job.client?.name || 'Unknown Client',
          scheduledStart: job.scheduledStart,
          scheduledEnd: job.scheduledEnd,
          status: job.status,
          address: job.address
        })),
        recentInvoices: recentInvoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          client: inv.client?.name || 'Unknown Client',
          total: inv.total,
          status: inv.status,
          createdAt: inv.createdAt
        })),
        teamMembers: teamMembers.map((member: any) => ({
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
  });

  // Client management endpoints
  app.get("/api/clients", authenticateSession, async (req, res) => {
    try {
      const clients = await storage.getClientsByBusiness(req.session.businessId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticateSession, async (req, res) => {
    try {
      const data = insertClientSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
      });
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/clients/:id", authenticateSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, data);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", authenticateSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Job management endpoints
  app.get("/api/jobs", authenticateSession, async (req, res) => {
    try {
      const jobs = await storage.getJobsByBusiness(req.session.businessId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs", authenticateSession, async (req, res) => {
    try {
      const data = insertJobSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
        scheduledStart: req.body.scheduledStart ? new Date(req.body.scheduledStart) : null,
        scheduledEnd: req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null,
      });
      const job = await storage.createJob(data);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/jobs/:id", authenticateSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };
      if (updateData.scheduledStart) {
        updateData.scheduledStart = new Date(updateData.scheduledStart);
      }
      if (updateData.scheduledEnd) {
        updateData.scheduledEnd = new Date(updateData.scheduledEnd);
      }
      const data = insertJobSchema.partial().parse(updateData);
      const job = await storage.updateJob(id, data);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/jobs/:id", authenticateSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJob(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Invoice management endpoints
  app.get("/api/invoices", authenticateSession, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByBusiness(req.session.businessId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", authenticateSession, async (req, res) => {
    try {
      // Generate invoice number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const data = insertInvoiceSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
        invoiceNumber,
      });

      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // External API endpoints for n8n and ChatGPT
  app.get("/api/external/clients", authenticateApiKey, async (req, res) => {
    try {
      const clients = await storage.getClientsByBusiness(req.businessId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/external/jobs", authenticateApiKey, async (req, res) => {
    try {
      const jobs = await storage.getJobsByBusiness(req.businessId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/external/jobs", authenticateApiKey, async (req, res) => {
    try {
      const data = insertJobSchema.parse({
        ...req.body,
        businessId: req.businessId,
        scheduledStart: req.body.scheduledStart ? new Date(req.body.scheduledStart) : null,
        scheduledEnd: req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null,
      });

      const job = await storage.createJob(data);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/external/invoices", authenticateApiKey, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByBusiness(req.businessId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/external/invoices", authenticateApiKey, async (req, res) => {
    try {
      // Generate invoice number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const data = insertInvoiceSchema.parse({
        ...req.body,
        businessId: req.businessId,
        invoiceNumber,
      });

      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}