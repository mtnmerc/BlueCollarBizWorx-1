
import type { Express } from "express";
import passport from "passport";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients, jobs } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, error: "Not authenticated" });
}

// GPT Authentication middleware
function authenticateGPT(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required' });
  }

  storage.getBusinessByApiKey(apiKey).then((business: any) => {
    if (!business) {
      return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    req.business = business;
    next();
  }).catch((error: any) => {
    console.error('GPT Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  });
}

export function registerRoutes(app: Express) {
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Authentication routes
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, error: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err: any) => {
        if (err) return next(err);
        res.json({ success: true, data: user });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ success: true, data: req.user });
    } else {
      res.status(401).json({ success: false, error: 'Not authenticated' });
    }
  });

  // GPT Routes - Keep only the working ones
  app.get('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    try {
      const business = req.business;
      const clientsList = await storage.getClientsByBusiness(business.id);
      
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

  app.post('/api/gpt/clients', authenticateGPT, async (req: any, res: any) => {
    try {
      const business = req.business;
      
      const clientData = {
        businessId: business.id,
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null
      };

      const newClient = await storage.createClient(clientData);
      
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

  app.get('/api/gpt/jobs', authenticateGPT, async (req: any, res: any) => {
    try {
      const business = req.business;
      
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

      res.json({
        success: true,
        data: rawJobs,
        message: `Found ${rawJobs.length} jobs for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT Jobs error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch jobs', details: error.message });
    }
  });

  app.post('/api/gpt/jobs', authenticateGPT, async (req: any, res: any) => {
    try {
      const business = req.business;
      
      const jobData = {
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

      const newJob = await storage.createJob(jobData);

      res.json({
        success: true,
        data: newJob,
        message: `Job "${newJob.title}" created successfully`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('GPT Create Job error:', error);
      res.status(500).json({ success: false, error: 'Failed to create job', details: error.message });
    }
  });

  // Standard application routes would go here...
  // Removed problematic estimate and invoice endpoints that were causing Vite issues
}
