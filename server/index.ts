
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration
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
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server running clean'
    });
  });

  // Authentication routes
  app.post("/api/auth/business/login", async (req, res) => {
    try {
      const { businessName, pin } = req.body;
      
      if (!businessName || !pin) {
        return res.status(400).json({ success: false, error: "Business name and PIN required" });
      }

      const business = await storage.getBusinessByName(businessName);
      if (!business) {
        return res.status(401).json({ success: false, error: "Business not found" });
      }

      const user = await storage.getUserByBusinessAndPin(business.id, pin);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid PIN" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).businessId = business.id;
      (req.session as any).role = user.role;

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          name: user.name, 
          role: user.role 
        },
        business: {
          id: business.id,
          name: business.name
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if ((req.session as any).userId) {
      res.json({ 
        success: true, 
        user: { 
          id: (req.session as any).userId,
          role: (req.session as any).role 
        }
      });
    } else {
      res.status(401).json({ success: false, error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ success: false, error: "Logout failed" });
      res.json({ success: true });
    });
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

  // Setup Vite only in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Clean server running on port ${port}`);
  });
})();
