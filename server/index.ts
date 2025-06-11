import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
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
  // Add CORS middleware manually for ChatGPT/OpenAI compatibility
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, Accept');
    res.header('Access-Control-Expose-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Add debug middleware to log all API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/')) {
      console.log(`API Request: ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
    }
    next();
  });



  // MCP functionality consolidated in server/routes.ts





  // All MCP endpoints consolidated in server/routes.ts under /api/mcp/ namespace

  // Register main API routes first (includes MCP endpoints)  
  const server = await registerRoutes(app);

  // Add middleware to ensure API routes are not intercepted by static serving
  app.use((req, res, next) => {
    // Skip static file serving for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/') || 
        req.path.startsWith('/getClients') || req.path.startsWith('/getJobs') || 
        req.path.startsWith('/getDashboard') || req.path.startsWith('/deleteClient') || 
        req.path.startsWith('/health')) {
      return next('route'); // Skip to next route handler, bypass static serving
    }
    next();
  });

  // Setup static file serving and frontend routing AFTER API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add comprehensive error handler for JSON responses
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("Server Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Always return JSON for API endpoints
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/') || req.path.startsWith('/getClients') || req.path.startsWith('/getJobs') || req.path.startsWith('/getDashboard') || req.path.startsWith('/deleteClient')) {
      return res.status(status).json({ 
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(status).json({ message });
  });

  // Global 404 handler for API routes - ensure JSON response
  app.use('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/gpt/') || req.path.startsWith('/getClients') || req.path.startsWith('/getJobs') || req.path.startsWith('/getDashboard') || req.path.startsWith('/deleteClient')) {
      return res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
          'GET /getClients',
          'GET /getJobs', 
          'GET /getDashboard',
          'DELETE /api/gpt/clients/:id',
          'GET /api/gpt/clients',
          'GET /api/gpt/jobs',
          'GET /api/gpt/dashboard'
        ]
      });
    }
    res.status(404).send('Not Found');
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();