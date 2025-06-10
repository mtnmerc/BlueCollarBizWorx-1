import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Log the error instead of throwing it after response is sent
    console.error("Error:", err);
  });

    // Add CORS middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // MCP endpoints served directly through main app
  app.post('/mcp/execute', async (req, res) => {
    try {
      const { tool, apiKey, ...params } = req.body;

      if (!tool || !apiKey) {
        return res.status(400).json({ error: 'Tool and API key required' });
      }

      // Forward to internal MCP server
      const response = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, apiKey, ...params })
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('MCP Execute Error:', error);
      res.status(500).json({ error: 'MCP server unavailable' });
    }
  });

  // MCP health check
  app.get('/mcp/health', async (req, res) => {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(502).json({ error: 'MCP server unavailable' });
    }
  });

  // MCP tools list
  app.get('/mcp/tools', async (req, res) => {
    try {
      const response = await fetch('http://localhost:3001/tools');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(502).json({ error: 'MCP server unavailable' });
    }
  });

  // MCP configuration for N8N
  app.get('/mcp/config', (req, res) => {
    res.json({
      server: {
        name: "bizworx-mcp-server",
        version: "1.0.0",
        protocolVersion: "2024-11-05"
      },
      endpoints: {
        execute: "/mcp/execute",
        health: "/mcp/health",
        tools: "/mcp/tools"
      },
      authentication: {
        required: true,
        method: "body",
        field: "apiKey"
      },
      baseUrl: "https://BluecollarBizWorx.replit.app"
    });
  });

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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();