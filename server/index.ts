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
  // Add CORS middleware first
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Tool mapping for direct MCP integration
  const toolMap = {
    'get_clients': { endpoint: '/api/external/clients', method: 'GET' },
    'create_client': { endpoint: '/api/external/clients', method: 'POST' },
    'get_jobs': { endpoint: '/api/external/jobs', method: 'GET' },
    'create_job': { endpoint: '/api/external/jobs', method: 'POST' },
    'get_invoices': { endpoint: '/api/external/invoices', method: 'GET' },
    'create_invoice': { endpoint: '/api/external/invoices', method: 'POST' },
    'get_estimates': { endpoint: '/api/external/estimates', method: 'GET' },
    'create_estimate': { endpoint: '/api/external/estimates', method: 'POST' },
    'update_job_status': { endpoint: '/api/external/jobs/{id}', method: 'PATCH' },
    'get_revenue_stats': { endpoint: '/api/external/revenue', method: 'GET' },
    'get_services': { endpoint: '/api/external/services', method: 'GET' }
  };

  // Helper function for tool descriptions
  const getToolDescription = (toolName: string) => {
    const descriptions = {
      'get_clients': 'Get list of all clients',
      'create_client': 'Create a new client',
      'get_jobs': 'Get jobs for a specific date or all jobs',
      'create_job': 'Create a new job',
      'get_invoices': 'Get list of all invoices',
      'create_invoice': 'Create a new invoice',
      'get_estimates': 'Get list of all estimates',
      'create_estimate': 'Create a new estimate',
      'update_job_status': 'Update job status',
      'get_revenue_stats': 'Get revenue statistics',
      'get_services': 'Get list of all services'
    };
    return descriptions[toolName] || 'Unknown tool';
  };

  // Direct API call function for MCP tools - use localhost for internal calls
  const callBizWorxAPI = async (endpoint: string, options: any = {}) => {
    const baseUrl = 'http://localhost:5000'; // Use internal localhost for better performance

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': options.apiKey,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('BizWorx API Error:', error);
      throw error;
    }
  };

  // MCP tool execution endpoint
  app.post('/mcp/:toolName', async (req, res) => {
    try {
      const { toolName } = req.params;
      const parameters = req.body;
      const apiKey = req.headers['x-api-key'] || parameters.apiKey;

      if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
      }

      const tool = toolMap[toolName];
      if (!tool) {
        return res.status(404).json({ error: `Tool ${toolName} not found` });
      }

      let endpoint = tool.endpoint;
      let body = parameters;

      // Handle special cases
      if (toolName === 'update_job_status' && parameters.jobId) {
        endpoint = endpoint.replace('{id}', parameters.jobId);
        body = { status: parameters.status };
      }

      const result = await callBizWorxAPI(endpoint, {
        method: tool.method,
        apiKey,
        body: tool.method !== 'GET' ? body : undefined
      });

      res.json(result);
    } catch (error) {
      console.error('Tool execution error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // MCP Server configuration endpoint
  app.get('/mcp/config', (req, res) => {
    res.json({
      server: {
        name: "bizworx-mcp-server",
        version: "1.0.0",
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {
            listChanged: false
          },
          resources: {},
          prompts: {},
          experimental: {}
        }
      },
      endpoints: {
        call: "/mcp/call",
        tools: "/mcp/tools",
        health: "/mcp/health"
      },
      authentication: {
        required: true,
        method: "X-API-Key",
        description: "Business API key required in X-API-Key header"
      },
      baseUrl: "https://bluecollar-bizworx.replit.app",
      tools: Object.keys(toolMap).map(name => ({
        name,
        description: getToolDescription(name),
        inputSchema: {
          type: 'object',
          properties: {
            apiKey: { 
              type: 'string', 
              description: 'Business API key for authentication' 
            }
          },
          required: ['apiKey']
        }
      }))
    });
  });

  // MCP health check
  app.get('/mcp/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      server: 'BizWorx MCP Server (Integrated)',
      version: '1.0.0',
      protocol: "2024-11-05",
      tools_count: Object.keys(toolMap).length,
      endpoints: ["/mcp/call", "/mcp/tools", "/mcp/config", "/mcp/:toolName"],
      external_url: "https://bluecollar-bizworx.replit.app/mcp",
      note: "MCP server running on main port 5000, externally accessible"
    });
  });

  // Simple MCP test endpoint
  app.get('/mcp/test', (req, res) => {
    res.json({
      message: 'MCP server is externally accessible',
      timestamp: new Date().toISOString(),
      available_endpoints: [
        'GET /mcp/health - Server health check',
        'GET /mcp/config - Server configuration',
        'GET /mcp/tools - List available tools', 
        'POST /mcp/call - Standard MCP protocol calls',
        'POST /mcp/:toolName - Direct tool execution'
      ],
      example_tool_call: {
        method: 'POST',
        url: 'https://bluecollar-bizworx.replit.app/mcp/get_clients',
        headers: { 'X-API-Key': 'your-api-key' },
        body: { apiKey: 'your-api-key' }
      }
    });
  });

  // List available tools
  app.get('/mcp/tools', (req, res) => {
    const tools = Object.keys(toolMap).map(name => ({
      name,
      description: getToolDescription(name)
    }));
    res.json({ tools });
  });

  // MCP call endpoint for standard MCP protocol
  app.post('/mcp/call', async (req, res) => {
    try {
      const { method, params, id } = req.body;
      const apiKey = req.headers['x-api-key'] || params?.apiKey;

      if (method === 'initialize') {
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'bizworx-mcp-server',
              version: '1.0.0'
            }
          }
        });
      } else if (method === 'tools/list') {
        const tools = Object.keys(toolMap).map(name => ({
          name,
          description: getToolDescription(name),
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' }
            },
            required: ['apiKey']
          }
        }));

        res.json({
          jsonrpc: '2.0',
          id: id,
          result: { tools }
        });
      } else if (method === 'tools/call') {
        if (!apiKey) {
          return res.status(401).json({
            jsonrpc: '2.0',
            id: id,
            error: { code: -32603, message: 'API key required' }
          });
        }

        const toolName = params.name;
        const tool = toolMap[toolName];

        if (!tool) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: id,
            error: { code: -32601, message: `Tool not found: ${toolName}` }
          });
        }

        let endpoint = tool.endpoint;
        let body = params.arguments;

        // Handle special cases
        if (toolName === 'update_job_status' && body.jobId) {
          endpoint = endpoint.replace('{id}', body.jobId);
          body = { status: body.status };
        }

        const result = await callBizWorxAPI(endpoint, {
          method: tool.method,
          apiKey,
          body: tool.method !== 'GET' ? body : undefined
        });

        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          }
        });
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          id: id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
      }
    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id || null,
        error: { code: -32603, message: error.message }
      });
    }
  });

  // Add error handler after routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // Register main API routes after MCP endpoints
  const server = await registerRoutes(app);

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