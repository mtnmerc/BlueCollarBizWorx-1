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





  // Import and register the complete GPT routes (includes all endpoints including PUT)
  const { registerGPTRoutes } = await import("./gpt-routes-final");
  registerGPTRoutes(app);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server with direct GPT routes'
    });
  });

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