import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerGPTRoutes } from "./gpt-routes-final";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients, jobs, services, timeEntries, users } from "@shared/schema";
import { eq, desc, and, gte, lte, sql, isNull } from "drizzle-orm";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
        ...req.body,
        businessId: (req.session as any).businessId
      };

      const client = await storage.createClient(clientData);
      res.json({ success: true, data: client });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Estimate routes
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

  app.post("/api/estimates", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const estimateData = {
        ...req.body,
        businessId: (req.session as any).businessId
      };

      const estimate = await storage.createEstimate(estimateData);
      res.json({ success: true, data: estimate });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Invoice routes
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

  app.post("/api/invoices", async (req, res) => {
    try {
      if (!(req.session as any).businessId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      const invoiceData = {
        ...req.body,
        businessId: (req.session as any).businessId
      };

      const invoice = await storage.createInvoice(invoiceData);
      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}