import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { db } from "./db";
import { estimates, invoices, clients } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Use simple memory session store for now (works in both dev and production)
app.use(session({
  secret: process.env.SESSION_SECRET || "bizworx-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow HTTP for now
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // Default 24 hours, can be extended per login
  },
}));

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
  // Add CORS middleware first
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Add debug middleware to log all API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/')) {
      console.log(`API Request: ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
    }
    next();
  });



  // MCP functionality consolidated in server/routes.ts





  // Authentication routes
  app.post("/api/auth/business/register", async (req, res) => {
    try {
      const { name, email, password, phone, address } = req.body;
      
      // Check if business already exists
      const existingBusiness = await storage.getBusinessByEmail(email);
      if (existingBusiness) {
        return res.status(400).json({ success: false, error: "Business with this email already exists" });
      }

      const businessData = {
        name,
        email,
        phone: phone || null,
        address: address || null,
        apiKey: `bw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
      };

      const business = await storage.createBusiness(businessData);
      
      // Set session
      (req.session as any).businessId = business.id;
      (req.session as any).pendingSetup = true;

      res.json({ 
        success: true, 
        business,
        message: "Business registered successfully"
      });
    } catch (error: any) {
      console.error('Business registration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/auth/business/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const business = await storage.getBusinessByEmail(email);
      if (!business) {
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      // For now, we'll skip password verification since it's not implemented in storage
      // In production, you'd verify the password hash here
      
      // Check if business has any users (admin setup completed)
      const users = await storage.getUsersByBusiness(business.id);
      const hasAdmin = users.some(user => user.role === 'owner' || user.role === 'admin');

      (req.session as any).businessId = business.id;

      if (hasAdmin) {
        // Business setup is complete, but user still needs to login with PIN
        res.json({ 
          success: true, 
          business,
          user: null,
          message: "Business login successful. Please enter your PIN."
        });
      } else {
        // Business exists but no admin user created yet
        (req.session as any).pendingSetup = true;
        res.json({ 
          success: true, 
          business,
          user: null,
          requiresSetup: true,
          message: "Business login successful. Please complete setup."
        });
      }
    } catch (error: any) {
      console.error('Business login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

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
      delete (req.session as any).pendingSetup;

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

  app.post("/api/auth/setup", async (req, res) => {
    try {
      const { firstName, lastName, pin } = req.body;
      const businessId = (req.session as any).businessId;

      if (!businessId || !(req.session as any).pendingSetup) {
        return res.status(401).json({ success: false, error: "Invalid setup session" });
      }

      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ success: false, error: "Business not found" });
      }

      const userData = {
        businessId,
        name: `${firstName} ${lastName}`,
        email: business.email,
        role: 'owner' as const,
        pin,
        hourlyRate: "25.00"
      };

      const user = await storage.createUser(userData);

      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      delete (req.session as any).pendingSetup;

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

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

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

  // Import and register the complete GPT routes (includes all endpoints including PUT)
  const { registerGPTRoutes } = await import("./gpt-routes-final");
  registerGPTRoutes(app);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server with authentication and GPT routes'
    });
  });

  console.log('Authentication routes registered');
  console.log('DIRECT SERVER: GPT routes registered with highest priority');

  // Add error handler after routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();