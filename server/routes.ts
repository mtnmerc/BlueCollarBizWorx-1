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
      req.session.save(); // Ensure session is saved

      res.json({ business, setupMode: true });
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

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Check if we're in setup mode (business registered but no admin user created yet)
      if (req.session.setupMode && req.session.businessId) {
        const business = await storage.getBusinessById(req.session.businessId);
        if (business) {
          return res.json({ setupMode: true, business });
        }
      }

      // Normal authentication check
      if (!req.session.userId || !req.session.businessId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUserById(req.session.userId);
      const business = await storage.getBusinessById(req.session.businessId);
      
      if (!user || !business) {
        return res.status(401).json({ error: "Authentication required" });
      }

      res.json({ user, business });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // User profile endpoint
  app.patch("/api/user/profile", authenticateSession, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { firstName, lastName, pin } = req.body;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Build update data
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (pin && pin.length >= 4) updateData.pin = pin;

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
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
      const jobData = {
        businessId: (req.session as any).businessId,
        clientId: req.body.clientId,
        assignedUserId: req.body.assignedUserId || null,
        title: req.body.title,
        description: req.body.description,
        address: req.body.address || null,
        scheduledStart: req.body.scheduledStart ? req.body.scheduledStart : null,
        scheduledEnd: req.body.scheduledEnd ? req.body.scheduledEnd : null,
        status: req.body.status || "scheduled",
        priority: req.body.priority || "normal",
        jobType: req.body.jobType || null,
        estimatedAmount: req.body.estimatedAmount ? String(req.body.estimatedAmount) : null,
        notes: req.body.notes || null,
        isRecurring: req.body.isRecurring || false,
        recurringFrequency: req.body.recurringFrequency || null,
        recurringEndDate: req.body.recurringEndDate || null,
      };
      
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error: any) {
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
      
      // Generate unique estimate number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
      const estimateNumber = `EST-${dateStr}-${timeStr}`;

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

  // Generate share token for estimate
  app.post("/api/estimates/:id/share", authenticateSession, async (req, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimateById(estimateId);
      if (!estimate || estimate.businessId !== req.session.businessId) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      
      const shareToken = await storage.generateShareToken(estimateId);
      res.json({ shareToken });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Public estimate view (no authentication required)
  app.get("/api/public/estimates/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      const estimate = await storage.getEstimateByShareToken(shareToken);
      
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      // Get related business and client data
      const business = await storage.getBusinessById(estimate.businessId);
      const client = await storage.getClientById(estimate.clientId);

      res.json({ estimate, business, client });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete estimate
  app.delete("/api/estimates/:id", authenticateSession, async (req, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const { businessId } = req.session;

      const estimate = await storage.getEstimateById(estimateId);
      if (!estimate || estimate.businessId !== businessId) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      await storage.deleteEstimate(estimateId);
      res.json({ success: true, message: "Estimate deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Convert estimate to invoice
  app.post("/api/estimates/:id/convert-to-invoice", async (req, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const businessId = req.session.businessId;

      if (!businessId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get the estimate first
      const estimate = await storage.getEstimateById(estimateId);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      if (estimate.businessId !== businessId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (estimate.status !== "approved") {
        return res.status(400).json({ error: "Only approved estimates can be converted to invoices" });
      }

      // Create invoice from estimate
      const invoice = await storage.convertEstimateToInvoice(estimateId);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Record payment for invoice
  app.post("/api/invoices/:id/payment", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { businessId } = req.session;
      const { amount, method, notes } = req.body;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const paymentAmount = parseFloat(amount);
      const invoiceTotal = parseFloat(invoice.total);
      const currentAmountPaid = parseFloat(invoice.amountPaid || "0");
      const depositAmount = parseFloat(invoice.depositAmount || "0");
      const depositPaid = invoice.depositPaid ? depositAmount : 0;
      
      const newAmountPaid = currentAmountPaid + paymentAmount;
      const remainingBalance = invoiceTotal - newAmountPaid;

      // Determine new status based on payment
      let newStatus = invoice.status;
      if (newAmountPaid >= invoiceTotal) {
        newStatus = "paid";
      } else if (newAmountPaid > 0) {
        newStatus = "partial";
      }

      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        amountPaid: newAmountPaid.toString(),
        remainingBalance: Math.max(0, remainingBalance).toString(),
        status: newStatus,
        lastPaymentDate: new Date(),
        lastPaymentMethod: method,
        lastPaymentAmount: paymentAmount.toString(),
        paymentNotes: notes || null,
      });

      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { businessId } = req.session;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      await storage.deleteInvoice(invoiceId);
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload photos to invoice
  app.post("/api/invoices/:id/photos", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { businessId } = req.session;
      const { photos } = req.body;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const currentPhotos = invoice.photos ? JSON.parse(JSON.stringify(invoice.photos)) : [];
      const newPhotos = [...currentPhotos, ...photos];

      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        photos: newPhotos
      });

      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove photo from invoice
  app.delete("/api/invoices/:id/photos/:photoIndex", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const photoIndex = parseInt(req.params.photoIndex);
      const { businessId } = req.session;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const currentPhotos = invoice.photos ? JSON.parse(JSON.stringify(invoice.photos)) : [];
      if (photoIndex < 0 || photoIndex >= currentPhotos.length) {
        return res.status(400).json({ error: "Invalid photo index" });
      }

      currentPhotos.splice(photoIndex, 1);

      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        photos: currentPhotos
      });

      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public invoice endpoint (no auth required)
  app.get("/api/public/invoice/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      const invoice = await storage.getInvoiceByShareToken(shareToken);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Include client information for the public view
      const client = await storage.getClientById(invoice.clientId);
      const business = await storage.getBusinessById(invoice.businessId);
      
      res.json({
        ...invoice,
        clientName: client?.name,
        clientEmail: client?.email,
        clientPhone: client?.phone,
        businessName: business?.name,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        businessAddress: business?.address,
        businessLogo: business?.logo
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Client response to estimate (no authentication required)
  app.post("/api/public/estimates/:shareToken/respond", async (req, res) => {
    try {
      const { shareToken } = req.params;
      const { status, response, signature } = req.body;
      
      const estimate = await storage.getEstimateByShareToken(shareToken);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      const updatedEstimate = await storage.updateEstimate(estimate.id, {
        status,
        clientResponse: response,
        clientSignature: signature || null,
        clientRespondedAt: new Date(),
      });

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
      
      // Calculate today's hours
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEntries = await storage.getTimeEntriesByUserAndDate(userId, today);
      const todayHours = todayEntries.reduce((total, entry) => total + (entry.totalHours || 0), 0);
      
      res.json({ 
        activeEntry,
        todayHours: Math.round(todayHours * 100) / 100 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get time entries for payroll management
  app.get("/api/time/entries", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { startDate, endDate, userId } = req.query;
      const entries = await storage.getTimeEntriesForPayroll(
        req.session.businessId, 
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        userId ? parseInt(userId as string) : undefined
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Edit time entry
  app.put("/api/time/entries/:id", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const entryId = parseInt(req.params.id);
      const { clockIn, clockOut, totalHours } = req.body;
      
      const updatedEntry = await storage.updateTimeEntry(entryId, {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        totalHours: totalHours ? parseFloat(totalHours) : undefined
      });

      res.json(updatedEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get payroll settings
  app.get("/api/payroll/settings", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const settings = await storage.getPayrollSettings(req.session.businessId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update payroll settings
  app.put("/api/payroll/settings", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const settings = await storage.updatePayrollSettings(req.session.businessId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: error.message });
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

  // Collect deposit payment for invoice
  app.post("/api/invoices/:id/collect-deposit", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const businessId = req.session.businessId;

      if (!businessId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (!invoice.depositRequired || !invoice.depositAmount) {
        return res.status(400).json({ error: "No deposit required for this invoice" });
      }

      if (invoice.depositPaid) {
        return res.status(400).json({ error: "Deposit already collected" });
      }

      // Here we would integrate with Stripe to create a payment link
      // For now, we'll return a success response indicating the payment link would be created
      // This requires Stripe API keys to be properly configured

      res.json({ 
        success: true, 
        message: "Deposit collection initiated",
        depositAmount: invoice.depositAmount
      });
    } catch (error: any) {
      console.error("Collect deposit error:", error);
      res.status(500).json({ error: "Failed to initiate deposit collection" });
    }
  });

  // Mark deposit as collected manually (cash/check)
  app.post("/api/invoices/:id/mark-deposit-collected", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const businessId = req.session.businessId;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (!invoice.depositRequired || !invoice.depositAmount) {
        return res.status(400).json({ error: "No deposit required for this invoice" });
      }

      if (invoice.depositPaid) {
        return res.status(400).json({ error: "Deposit already collected" });
      }

      // Mark deposit as paid and record the payment amount
      const depositAmount = parseFloat(invoice.depositAmount);
      const currentAmountPaid = parseFloat(invoice.amountPaid || "0");
      const newAmountPaid = currentAmountPaid + depositAmount;
      const totalAmount = parseFloat(invoice.total);
      
      // Determine new status based on amount paid
      let newStatus = invoice.status;
      if (newAmountPaid >= totalAmount) {
        newStatus = "paid";
      } else if (newAmountPaid > 0) {
        newStatus = "partial";
      }

      await storage.updateInvoice(invoiceId, {
        depositPaid: true,
        depositPaidAt: new Date().toISOString(),
        amountPaid: newAmountPaid.toFixed(2),
        status: newStatus,
      });

      res.json({ 
        success: true, 
        message: "Deposit marked as collected successfully"
      });
    } catch (error: any) {
      console.error("Mark deposit collected error:", error);
      res.status(500).json({ error: "Failed to mark deposit as collected" });
    }
  });

  // Generate share token for invoice
  app.post("/api/invoices/:id/share", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const businessId = req.session.businessId;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const shareToken = await storage.generateInvoiceShareToken(invoiceId);
      res.json({ shareToken });
    } catch (error: any) {
      console.error("Generate invoice share token error:", error);
      res.status(500).json({ error: "Failed to generate share token" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/send-email", authenticateSession, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const businessId = req.session.businessId;

      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice || invoice.businessId !== businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Update invoice status to sent
      await storage.updateInvoice(invoiceId, { status: "sent" });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Send invoice email error:", error);
      res.status(500).json({ error: "Failed to send invoice email" });
    }
  });

  // Get team members/users for business
  app.get("/api/users", async (req, res) => {
    if (!req.session.businessId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const users = await storage.getUsersByBusiness(req.session.businessId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get payroll data for admin
  app.get("/api/time/payroll", async (req, res) => {
    if (!req.session.role || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { userId, startDate, endDate } = req.query;
      const entries = await storage.getTimeEntriesForPayroll(
        req.session.businessId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        userId && userId !== "all" ? parseInt(userId as string) : undefined
      );
      
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get payroll data" });
    }
  });

  // Update time entry
  app.put("/api/time/entries/:id", async (req, res) => {
    if (!req.session.role || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const { totalHours } = req.body;
      
      const updatedEntry = await storage.updateTimeEntry(parseInt(id), {
        totalHours: totalHours as string
      });
      
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  // Export payroll data as CSV
  app.get("/api/time/export", async (req, res) => {
    if (!req.session.role || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { userId, startDate, endDate } = req.query;
      const entries = await storage.getTimeEntriesForPayroll(
        req.session.businessId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        userId && userId !== "all" ? parseInt(userId as string) : undefined
      );

      // Generate CSV content
      const csvHeader = "Employee,Date,Clock In,Clock Out,Break Duration,Total Hours\n";
      const csvRows = entries.map((entry: any) => {
        const breakDuration = entry.breakStart && entry.breakEnd 
          ? Math.round((new Date(entry.breakEnd).getTime() - new Date(entry.breakStart).getTime()) / (1000 * 60))
          : 0;
        
        return [
          `"${entry.user?.firstName || ''} ${entry.user?.lastName || ''}"`,
          new Date(entry.clockIn).toLocaleDateString(),
          new Date(entry.clockIn).toLocaleTimeString(),
          entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : "Active",
          breakDuration ? `${breakDuration} min` : "-",
          entry.totalHours || "0"
        ].join(",");
      }).join("\n");

      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payroll-export.csv"');
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to export payroll data" });
    }
  });

  // Get payroll settings
  app.get("/api/payroll/settings", async (req, res) => {
    if (!req.session.role || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const settings = await storage.getPayrollSettings(req.session.businessId);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get payroll settings" });
    }
  });

  // Update payroll settings
  app.put("/api/payroll/settings", async (req, res) => {
    if (!req.session.role || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const settings = await storage.updatePayrollSettings(req.session.businessId, req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update payroll settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
