import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessSchema, insertUserSchema, insertClientSchema, insertServiceSchema, insertJobSchema, insertInvoiceSchema, insertEstimateSchema, insertTimeEntrySchema } from "@shared/schema";
import { z } from "zod";

// Authentication middleware
const authenticateSession = (req: any, res: any, next: any) => {
  if (!req.session?.businessId || !req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Business authentication
  app.post("/api/auth/business/register", async (req, res) => {
    try {
      const data = insertBusinessSchema.parse(req.body);
      
      // Check if business already exists
      const existing = await storage.getBusinessByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Business already exists with this email" });
      }

      const business = await storage.createBusiness(data);
      
      req.session.businessId = business.id;
      req.session.setupMode = true; // Flag for setup completion

      res.json({ business, needsSetup: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/business/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const business = await storage.getBusinessByEmail(email);
      if (!business || business.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.businessId = business.id;
      
      // Check if business has any users (setup completed)
      const users = await storage.getUsersByBusiness(business.id);
      if (users.length === 0) {
        req.session.setupMode = true;
        return res.json({ business, needsSetup: true });
      }

      // Normal login flow - requires PIN
      res.json({ business, needsPinLogin: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/setup", async (req, res) => {
    try {
      const { firstName, lastName, pin } = req.body;
      const { businessId, setupMode } = req.session as any;
      
      if (!businessId || !setupMode) {
        return res.status(401).json({ error: "Setup mode required" });
      }

      // Create admin user
      const adminUser = await storage.createUser({
        businessId,
        username: "admin",
        pin,
        role: "admin",
        firstName,
        lastName,
      });

      // Clear setup mode and login
      delete req.session.setupMode;
      req.session.userId = adminUser.id;
      req.session.role = "admin";

      res.json({ user: adminUser });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/user/login", async (req, res) => {
    try {
      const { pin } = req.body;
      const { businessId } = req.session;
      
      if (!businessId) {
        return res.status(401).json({ error: "Business not selected" });
      }

      const user = await storage.getUserByPin(businessId, pin);
      if (!user) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", authenticateSession, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      const business = await storage.getBusinessById(req.session.businessId);
      res.json({ user, business });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Business settings endpoints
  app.patch("/api/business/settings", authenticateSession, async (req, res) => {
    try {
      const business = await storage.getBusinessById(req.session.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const updatedBusiness = await storage.updateBusiness(req.session.businessId, req.body);
      res.json(updatedBusiness);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/business/logo", authenticateSession, async (req, res) => {
    try {
      const business = await storage.getBusinessById(req.session.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const updatedBusiness = await storage.updateBusiness(req.session.businessId, { logo: req.body.logo });
      res.json(updatedBusiness);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateSession, async (req, res) => {
    try {
      const { businessId } = req.session;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const revenue = await storage.getRevenueStats(businessId, currentMonth, currentYear);
      const todaysJobs = await storage.getJobsByDate(businessId, now);
      const recentInvoices = await storage.getInvoicesByBusiness(businessId);
      const teamMembers = await storage.getUsersByBusiness(businessId);

      res.json({
        revenue,
        todaysJobs: todaysJobs.slice(0, 5),
        recentInvoices: recentInvoices.slice(0, 5),
        teamMembers,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clients
  app.get("/api/clients", authenticateSession, async (req, res) => {
    try {
      const clients = await storage.getClientsByBusiness(req.session.businessId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/clients/:id", authenticateSession, async (req, res) => {
    try {
      const client = await storage.getClientById(parseInt(req.params.id));
      if (!client || client.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/clients/:id", authenticateSession, async (req, res) => {
    try {
      const client = await storage.getClientById(parseInt(req.params.id));
      if (!client || client.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const data = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(parseInt(req.params.id), data);
      res.json(updatedClient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Services
  app.get("/api/services", authenticateSession, async (req, res) => {
    try {
      const services = await storage.getServicesByBusiness(req.session.businessId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/services", authenticateSession, async (req, res) => {
    try {
      console.log("Service creation request body:", JSON.stringify(req.body, null, 2));
      
      const requestData = {
        ...req.body,
        businessId: req.session.businessId,
      };
      
      console.log("Data being validated:", JSON.stringify(requestData, null, 2));
      
      const data = insertServiceSchema.parse(requestData);
      const service = await storage.createService(data);
      res.json(service);
    } catch (error) {
      console.log("Service creation validation error:", error.message);
      if (error.issues) {
        console.log("Validation issues:", JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/services/:id", authenticateSession, async (req, res) => {
    try {
      const service = await storage.getServiceById(parseInt(req.params.id));
      if (!service || service.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/services/:id", authenticateSession, async (req, res) => {
    try {
      const service = await storage.getServiceById(parseInt(req.params.id));
      if (!service || service.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      const data = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(parseInt(req.params.id), data);
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/services/:id", authenticateSession, async (req, res) => {
    try {
      const service = await storage.getServiceById(parseInt(req.params.id));
      if (!service || service.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      await storage.deleteService(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Jobs
  app.get("/api/jobs", authenticateSession, async (req, res) => {
    try {
      const jobs = await storage.getJobsByBusiness(req.session.businessId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jobs", authenticateSession, async (req, res) => {
    try {
      const data = insertJobSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
      });
      const job = await storage.createJob(data);
      res.json(job);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/jobs/:id", authenticateSession, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/jobs/:id", authenticateSession, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      const updatedJob = await storage.updateJob(parseInt(req.params.id), req.body);
      res.json(updatedJob);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Invoices
  app.get("/api/invoices", authenticateSession, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByBusiness(req.session.businessId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoices", authenticateSession, async (req, res) => {
    try {
      // Generate invoice number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}A`; // TODO: Handle multiple invoices per day

      const data = insertInvoiceSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
        invoiceNumber,
      });
      
      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/invoices/:id", authenticateSession, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(parseInt(req.params.id));
      if (!invoice || invoice.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/invoices/:id", authenticateSession, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(parseInt(req.params.id));
      if (!invoice || invoice.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(parseInt(req.params.id), req.body);
      res.json(updatedInvoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Estimates
  app.get("/api/estimates", authenticateSession, async (req, res) => {
    try {
      const estimates = await storage.getEstimatesByBusiness(req.session.businessId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/estimates", authenticateSession, async (req, res) => {
    try {
      console.log("Estimate creation request body:", JSON.stringify(req.body, null, 2));
      
      // Generate estimate number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const estimateNumber = `EST-${dateStr}A`; // TODO: Handle multiple estimates per day

      const requestData = {
        ...req.body,
        businessId: req.session.businessId,
        estimateNumber,
      };
      
      console.log("Data being validated:", JSON.stringify(requestData, null, 2));

      const data = insertEstimateSchema.parse(requestData);
      
      const estimate = await storage.createEstimate(data);
      res.json(estimate);
    } catch (error) {
      console.log("Estimate creation validation error:", error.message);
      if (error.issues) {
        console.log("Validation issues:", JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/estimates/:id", authenticateSession, async (req, res) => {
    try {
      const estimate = await storage.getEstimateById(parseInt(req.params.id));
      if (!estimate || estimate.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/estimates/:id", authenticateSession, async (req, res) => {
    try {
      const estimate = await storage.getEstimateById(parseInt(req.params.id));
      if (!estimate || estimate.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      
      const updatedEstimate = await storage.updateEstimate(parseInt(req.params.id), req.body);
      res.json(updatedEstimate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Time tracking
  app.post("/api/time/clock-in", authenticateSession, async (req, res) => {
    try {
      const { userId } = req.session;
      
      // Check if user already has an active time entry
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (activeEntry) {
        return res.status(400).json({ error: "Already clocked in" });
      }

      const timeEntry = await storage.createTimeEntry({
        businessId: req.session.businessId,
        userId,
        clockIn: new Date(),
        jobId: req.body.jobId || null,
      });

      res.json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/time/clock-out", authenticateSession, async (req, res) => {
    try {
      const { userId } = req.session;
      
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (!activeEntry) {
        return res.status(400).json({ error: "Not currently clocked in" });
      }

      const clockOut = new Date();
      const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60);

      const updatedEntry = await storage.updateTimeEntry(activeEntry.id, {
        clockOut,
        totalHours: Math.round(totalHours * 4) / 4, // Round to nearest 15 minutes
      });

      res.json(updatedEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/time/status", authenticateSession, async (req, res) => {
    try {
      const { userId } = req.session;
      const activeEntry = await storage.getActiveTimeEntry(userId);
      res.json({ activeEntry });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Team management
  app.get("/api/team", authenticateSession, async (req, res) => {
    try {
      const users = await storage.getUsersByBusiness(req.session.businessId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/team", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const data = insertUserSchema.parse({
        ...req.body,
        businessId: req.session.businessId,
      });
      
      const user = await storage.createUser(data);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
