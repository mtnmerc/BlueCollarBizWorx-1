import type { Express } from "express";
import { db } from "./db";
import { businesses, users, clients, jobs, estimates, invoices } from "../shared/schema";
import { eq, desc, and } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    businessId?: number;
  }
}

export async function registerRoutes(app: Express) {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find business by email
      const business = await db.select().from(businesses).where(eq(businesses.email, email)).limit(1);
      if (!business.length) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password (in production, use proper password hashing)
      if (password !== business[0].password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get admin user for this business
      const user = await db.select().from(users)
        .where(and(eq(users.businessId, business[0].id), eq(users.role, 'admin')))
        .limit(1);

      if (!user.length) {
        return res.status(401).json({ error: "No admin user found" });
      }

      req.session.userId = user[0].id;
      req.session.businessId = business[0].id;

      res.json({
        user: user[0],
        business: business[0]
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }

    try {
      const user = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
      const business = await db.select().from(businesses).where(eq(businesses.id, req.session.businessId!)).limit(1);

      if (!user.length || !business.length) {
        req.session.destroy(() => {});
        return res.json(null);
      }

      res.json({
        user: user[0],
        business: business[0]
      });
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const businessId = req.session.businessId!;
      
      const [clientCount] = await db.select({ count: clients.id }).from(clients)
        .where(eq(clients.businessId, businessId));
      
      const [jobCount] = await db.select({ count: jobs.id }).from(jobs)
        .where(and(eq(jobs.businessId, businessId), eq(jobs.status, 'in_progress')));
      
      const [estimateCount] = await db.select({ count: estimates.id }).from(estimates)
        .where(and(eq(estimates.businessId, businessId), eq(estimates.status, 'sent')));

      res.json({
        totalClients: clientCount?.count || 0,
        activeJobs: jobCount?.count || 0,
        pendingEstimates: estimateCount?.count || 0,
        monthlyRevenue: 0,
        recentActivity: []
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Clients routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const businessId = req.session.businessId!;
      const clientList = await db.select().from(clients)
        .where(eq(clients.businessId, businessId))
        .orderBy(desc(clients.createdAt));
      
      res.json(clientList);
    } catch (error) {
      console.error('Clients fetch error:', error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Jobs routes
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const businessId = req.session.businessId!;
      const jobList = await db.select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        clientName: clients.name,
        address: jobs.address,
        scheduledStart: jobs.scheduledStart,
        scheduledEnd: jobs.scheduledEnd,
        status: jobs.status,
        priority: jobs.priority,
        estimatedAmount: jobs.estimatedAmount,
        assignedUserName: users.firstName
      })
      .from(jobs)
      .leftJoin(clients, eq(jobs.clientId, clients.id))
      .leftJoin(users, eq(jobs.assignedUserId, users.id))
      .where(eq(jobs.businessId, businessId))
      .orderBy(desc(jobs.createdAt));
      
      res.json(jobList);
    } catch (error) {
      console.error('Jobs fetch error:', error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Estimates routes
  app.get("/api/estimates", requireAuth, async (req, res) => {
    try {
      const businessId = req.session.businessId!;
      const estimateList = await db.select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        title: estimates.title,
        clientName: clients.name,
        total: estimates.total,
        status: estimates.status,
        validUntil: estimates.validUntil,
        createdAt: estimates.createdAt
      })
      .from(estimates)
      .leftJoin(clients, eq(estimates.clientId, clients.id))
      .where(eq(estimates.businessId, businessId))
      .orderBy(desc(estimates.createdAt));
      
      res.json(estimateList);
    } catch (error) {
      console.error('Estimates fetch error:', error);
      res.status(500).json({ error: "Failed to fetch estimates" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const businessId = req.session.businessId!;
      const invoiceList = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        clientName: clients.name,
        total: invoices.total,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidAt,
        createdAt: invoices.createdAt
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.createdAt));
      
      res.json(invoiceList);
    } catch (error) {
      console.error('Invoices fetch error:', error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  return app;
}