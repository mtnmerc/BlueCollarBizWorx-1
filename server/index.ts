import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";
import { registerGPTRoutes } from "./gpt-routes-final";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || "bizworx-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Configure passport authentication
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'pin' },
  async (email: string, pin: string, done) => {
    try {
      const user = await storage.getUserByEmailAndPin(email, pin);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or PIN' });
      }
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register GPT routes first
  registerGPTRoutes(app);

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
    if (req.isAuthenticated && req.isAuthenticated()) {
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
        password: req.body.ownerPin, // Use PIN as password
        phone: req.body.phone || null,
        address: req.body.address || null,
        apiKey: `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
      };

      const business = await storage.createBusiness(businessData);
      
      // Split name into first and last
      const nameParts = req.body.ownerName.split(' ');
      const firstName = nameParts[0] || req.body.ownerName;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const userData = {
        businessId: business.id,
        username: req.body.email,
        firstName: firstName,
        lastName: lastName,
        email: req.body.email,
        role: 'owner',
        pin: req.body.ownerPin,
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
      
      const timeEntries = await storage.getTimeEntriesByUser((req.session as any).userId);
      res.json({ success: true, data: timeEntries });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // Setup vite
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();