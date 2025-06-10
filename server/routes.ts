import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessSchema, insertUserSchema, insertClientSchema, insertServiceSchema, insertJobSchema, insertInvoiceSchema, insertEstimateSchema, insertTimeEntrySchema } from "@shared/schema";
import { z } from "zod";
import express from "express";
import path from "path";

// Authentication middleware
const authenticateSession = (req: any, res: any, next: any) => {
  if (!req.session?.businessId || !req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// API Key authentication middleware for external services like n8n
const authenticateApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  try {
    // Get business by API key (you'll need to add this method to storage)
    const business = await storage.getBusinessByApiKey(apiKey);
    if (!business) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Set business context for the request
    req.businessId = business.id;
    req.apiKeyAuth = true;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid API key" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Simple connectivity test endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'BizWorx server is accessible'
    });
  });

  // Priority middleware to handle MCP routes before any other middleware
  app.use('/mcp/*', (req, res, next) => {
    // Set headers to prevent caching and ensure proper response
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // MCP Server endpoints - must be first to avoid frontend routing conflicts
  
  // Tool mapping for MCP integration
  const toolMap: Record<string, { endpoint: string; method: string }> = {
    'get_clients': { endpoint: '/api/external/clients', method: 'GET' },
    'create_client': { endpoint: '/api/external/clients', method: 'POST' },
    'get_jobs': { endpoint: '/api/external/jobs', method: 'GET' },
    'create_job': { endpoint: '/api/external/jobs', method: 'POST' },
    'get_invoices': { endpoint: '/api/external/invoices', method: 'GET' },
    'create_invoice': { endpoint: '/api/external/invoices', method: 'POST' },
    'get_estimates': { endpoint: '/api/external/estimates', method: 'GET' },
    'create_estimate': { endpoint: '/api/external/estimates', method: 'POST' },
    'update_job_status': { endpoint: '/api/external/jobs', method: 'PATCH' },
    'get_revenue_stats': { endpoint: '/api/external/revenue', method: 'GET' },
    'get_services': { endpoint: '/api/external/services', method: 'GET' },
    'create_service': { endpoint: '/api/external/services', method: 'POST' }
  };

  // Tool descriptions
  const getToolDescription = (toolName: string): string => {
    const descriptions: Record<string, string> = {
      'get_clients': 'Retrieve all clients for a business',
      'create_client': 'Create a new client',
      'get_jobs': 'Retrieve all jobs for a business',
      'create_job': 'Create a new job/appointment',
      'get_invoices': 'Retrieve all invoices for a business',
      'create_invoice': 'Create a new invoice',
      'get_estimates': 'Retrieve all estimates for a business',
      'create_estimate': 'Create a new estimate',
      'update_job_status': 'Update the status of a job',
      'get_revenue_stats': 'Get revenue statistics for a business',
      'get_services': 'Retrieve all services for a business',
      'create_service': 'Create a new service or product'
    };
    return descriptions[toolName] || 'Unknown tool';
  };

  // MCP health check - accessible via /api/mcp/health
  app.get('/api/mcp/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      server: 'BizWorx MCP Server (Integrated)',
      version: '1.0.0',
      protocol: "2024-11-05",
      tools_count: Object.keys(toolMap).length,
      endpoints: ["/api/mcp/call", "/api/mcp/tools", "/api/mcp/config", "/api/mcp/:toolName"],
      external_url: "https://bluecollar-bizworx.replit.app/api/mcp",
      note: "MCP server running on main port 5000, externally accessible"
    });
  });

  // Simple MCP test endpoint
  app.get('/api/mcp/test', (req, res) => {
    res.json({
      message: 'MCP server is externally accessible',
      timestamp: new Date().toISOString(),
      available_endpoints: [
        'GET /api/mcp/health - Server health check',
        'GET /api/mcp/config - Server configuration',
        'GET /api/mcp/tools - List available tools', 
        'GET /api/mcp/sse - Server-Sent Events endpoint',
        'POST /api/mcp/call - Standard MCP protocol calls',
        'POST /api/mcp/:toolName - Direct tool execution'
      ],
      example_tool_call: {
        method: 'POST',
        url: 'https://bluecollar-bizworx.replit.app/api/mcp/get_clients',
        headers: { 'X-API-Key': 'your-api-key' },
        body: { apiKey: 'your-api-key' }
      }
    });
  });

  // MCP Server-Sent Events endpoint for N8N integration
  app.get('/api/mcp/sse', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'MCP SSE connection established',
      timestamp: new Date().toISOString(),
      server: 'BizWorx MCP Server',
      tools_available: Object.keys(toolMap).length
    })}\n\n`);

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        status: 'alive'
      })}\n\n`);
    }, 30000); // Every 30 seconds

    // Send available tools information
    res.write(`data: ${JSON.stringify({
      type: 'tools',
      tools: Object.keys(toolMap).map(name => ({
        name,
        description: getToolDescription(name),
        endpoint: `/mcp/${name}`,
        method: 'POST'
      })),
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      res.end();
    });

    req.on('error', () => {
      clearInterval(heartbeat);
      res.end();
    });
  });

  // MCP configuration endpoint
  app.get('/api/mcp/config', (req, res) => {
    res.json({
      name: "BizWorx MCP Server",
      version: "1.0.0",
      protocol: "2024-11-05",
      endpoints: {
        call: "/api/mcp/call",
        tools: "/api/mcp/tools",
        health: "/api/mcp/health"
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
          type: "object",
          properties: {
            apiKey: { type: "string", description: "Business API key" }
          },
          required: ["apiKey"]
        }
      }))
    });
  });

  // List available tools
  app.get('/api/mcp/tools', (req, res) => {
    const tools = Object.keys(toolMap).map(name => ({
      name,
      description: getToolDescription(name),
      inputSchema: {
        type: "object",
        properties: {
          apiKey: { type: "string", description: "Business API key" }
        },
        required: ["apiKey"]
      }
    }));

    res.json({ tools });
  });

  // Direct API call function for MCP tools
  const callBizWorxAPI = async (endpoint: string, options: any = {}) => {
    const baseUrl = 'http://localhost:5000';

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
    } catch (error: any) {
      console.error('BizWorx API Error:', error);
      throw error;
    }
  };

  // MCP tool execution endpoint
  app.post('/api/mcp/:toolName', async (req, res) => {
    try {
      const { toolName } = req.params;
      const { apiKey, ...params } = req.body;

      if (!apiKey) {
        return res.status(400).json({ 
          error: 'API key is required',
          example: { apiKey: 'your-business-api-key' }
        });
      }

      const tool = toolMap[toolName];
      if (!tool) {
        return res.status(404).json({ 
          error: `Tool '${toolName}' not found`,
          available_tools: Object.keys(toolMap)
        });
      }

      const result = await callBizWorxAPI(tool.endpoint, {
        method: tool.method,
        apiKey,
        body: params
      });

      res.json({
        tool: toolName,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`MCP Tool Error [${req.params.toolName}]:`, error);
      res.status(500).json({ 
        error: error.message || 'Internal server error',
        tool: req.params.toolName,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Standard MCP call endpoint
  app.post('/api/mcp/call', async (req, res) => {
    try {
      const { method, params } = req.body;

      if (method === 'tools/list') {
        const tools = Object.keys(toolMap).map(name => ({
          name,
          description: getToolDescription(name),
          inputSchema: {
            type: "object",
            properties: {
              apiKey: { type: "string", description: "Business API key" }
            },
            required: ["apiKey"]
          }
        }));

        return res.json({
          jsonrpc: "2.0",
          id: req.body.id || 1,
          result: { tools }
        });
      }

      if (method === 'tools/call') {
        const { name: toolName, arguments: args } = params;
        const { apiKey, ...toolParams } = args || {};

        if (!apiKey) {
          return res.status(400).json({
            jsonrpc: "2.0",
            id: req.body.id || 1,
            error: {
              code: -32602,
              message: "API key is required"
            }
          });
        }

        const tool = toolMap[toolName as keyof typeof toolMap];
        if (!tool) {
          return res.status(404).json({
            jsonrpc: "2.0",
            id: req.body.id || 1,
            error: {
              code: -32601,
              message: `Tool '${toolName}' not found`
            }
          });
        }

        const result = await callBizWorxAPI(tool.endpoint, {
          method: tool.method,
          apiKey,
          body: toolParams
        });

        return res.json({
          jsonrpc: "2.0",
          id: req.body.id || 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });
      }

      res.status(400).json({
        jsonrpc: "2.0",
        id: req.body.id || 1,
        error: {
          code: -32601,
          message: "Method not found"
        }
      });

    } catch (error: any) {
      console.error('MCP Call Error:', error);
      res.status(500).json({
        jsonrpc: "2.0",
        id: req.body.id || 1,
        error: {
          code: -32603,
          message: error.message || "Internal error"
        }
      });
    }
  });

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
      const { email, password, rememberMe } = req.body;

      const business = await storage.getBusinessByEmail(email);
      if (!business || business.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.businessId = business.id;

      // Set session duration based on rememberMe preference
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

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
      const { pin, rememberMe } = req.body;
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

      // Set session duration based on rememberMe preference
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

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

      // Include API key for admin users
      const businessWithApiKey = req.session.role === "admin" ? 
        { ...business, apiKey: business.apiKey } : 
        { ...business, apiKey: null };

      res.json({ user, business: businessWithApiKey });
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

  // Get current API key
  app.get("/api/business/api-key", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const business = await storage.getBusinessById(req.session.businessId);
      res.json({ apiKey: business?.apiKey || null });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate API key for external integrations
  app.post("/api/business/api-key", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const apiKey = await storage.generateApiKey(req.session.businessId);
      res.json({ apiKey });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Revoke API key
  app.delete("/api/business/api-key", authenticateSession, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.revokeApiKey(req.session.businessId);
      res.json({ success: true });
    } catch (error: any) {
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

      // Process the request body to handle date conversions properly
      const updateData = { ...req.body };

      // Convert date strings to Date objects if they exist
      if (updateData.scheduledStart && typeof updateData.scheduledStart === 'string') {
        updateData.scheduledStart = new Date(updateData.scheduledStart);
      }
      if (updateData.scheduledEnd && typeof updateData.scheduledEnd === 'string') {
        updateData.scheduledEnd = new Date(updateData.scheduledEnd);
      }
      if (updateData.recurringEndDate && typeof updateData.recurringEndDate === 'string') {
        updateData.recurringEndDate = new Date(updateData.recurringEndDate);
      }

      // Convert numeric fields
      if (updateData.clientId) {
        updateData.clientId = parseInt(updateData.clientId);
      }
      if (updateData.assignedUserId) {
        updateData.assignedUserId = parseInt(updateData.assignedUserId);
      }
      if (updateData.estimatedAmount) {
        updateData.estimatedAmount = parseFloat(updateData.estimatedAmount);
      }

      const updatedJob = await storage.updateJob(parseInt(req.params.id), updateData);
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

      // If this invoice is created from a job, mark the job as completed
      if (data.jobId) {
        await storage.updateJob(data.jobId, { status: "completed" });
      }

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

      // Handle validUntil date conversion safely
      const updateData = { ...req.body };
      if (updateData.validUntil && typeof updateData.validUntil === 'string') {
        updateData.validUntil = new Date(updateData.validUntil);
      }

      const updatedEstimate = await storage.updateEstimate(parseInt(req.params.id), updateData);
      res.json(updatedEstimate);
    } catch (error: any) {
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
      const newphotos: any = [...currentPhotos, ...photos];

      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        photos: newphotos
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

  // Update time entry (admin only)
  app.patch("/api/time/entries/:id", authenticateSession, async (req, res) => {
    try {
      if (!req.session.role || req.session.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const entryId = parseInt(req.params.id);
      const updateData: any = {};

      if (req.body.clockIn) {
        updateData.clockIn = new Date(req.body.clockIn);
      }
      if (req.body.clockOut) {
        updateData.clockOut = new Date(req.body.clockOut);
      }
      if (req.body.totalHours !== undefined) {
        updateData.totalHours = req.body.totalHours;
      }

      const updatedEntry = await storage.updateTimeEntry(entryId, updateData);
      res.json(updatedEntry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time entry" });
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

  // External API endpoints for n8n and other integrations

  // Download n8n workflow file
  app.get("/api/download/n8n-workflow", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const filePath = path.join(process.cwd(), "n8n-workflows", "bizworx-complete-workflow.json");
    res.download(filePath, "bizworx-complete-workflow.json", (err) => {
      if (err) {
        res.status(404).json({ error: "Workflow file not found" });
      }
    });
  });

  // External API endpoints (protected by API key)
  // Get all clients (external API)
  app.get("/api/external/clients", authenticateApiKey, async (req, res) => {
    try {
      const clients = await storage.getClientsByBusiness(req.businessId);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create client (external API)
  app.post("/api/external/clients", authenticateApiKey, async (req, res) => {
    try {
      const data = insertClientSchema.parse({
        ...req.body,
        businessId: req.businessId,
      });
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all estimates (external API)
  app.get("/api/external/estimates", authenticateApiKey, async (req, res) => {
    try {
      const estimates = await storage.getEstimatesByBusiness(req.businessId);
      res.json(estimates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create estimate (external API)
  app.post("/api/external/estimates", authenticateApiKey, async (req, res) => {
    try {
      // Generate estimate number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const estimateNumber = `EST-${dateStr}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const data = insertEstimateSchema.parse({
        ...req.body,
        businessId: req.businessId,
        estimateNumber,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
      });

      const estimate = await storage.createEstimate(data);
      res.json(estimate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all services (external API)
  app.get("/api/external/services", authenticateApiKey, async (req, res) => {
    try {
      const services = await storage.getServicesByBusiness(req.businessId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get revenue statistics (external API)
  app.get("/api/external/revenue", authenticateApiKey, async (req, res) => {
    try {
      const now = new Date();
      const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
      
      const revenue = await storage.getRevenueStats(req.businessId, month, year);
      res.json(revenue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update job status using PATCH method (external API)
  app.patch("/api/external/jobs/:id", authenticateApiKey, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const updatedJob = await storage.updateJob(parseInt(req.params.id), req.body);
      res.json(updatedJob);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all jobs (external API)
  app.get("/api/external/jobs", authenticateApiKey, async (req, res) => {
    try {
      const jobs = await storage.getJobsByBusiness(req.businessId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create job (external API)
  app.post("/api/external/jobs", authenticateApiKey, async (req, res) => {
    try {
      const jobData = {
        businessId: req.businessId,
        clientId: req.body.clientId,
        assignedUserId: req.body.assignedUserId || null,
        title: req.body.title,
        description: req.body.description,
        address: req.body.address || null,
        scheduledStart: req.body.scheduledStart ? new Date(req.body.scheduledStart) : null,
        scheduledEnd: req.body.scheduledEnd ? new Date(req.body.scheduledEnd) : null,
        status: req.body.status || "scheduled",
        priority: req.body.priority || "normal",
        jobType: req.body.jobType || null,
        estimatedAmount: req.body.estimatedAmount ? String(req.body.estimatedAmount) : null,
        notes: req.body.notes || null,
      };

      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update job status (external API)
  app.patch("/api/external/jobs/:id/status", authenticateApiKey, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const updatedJob = await storage.updateJob(parseInt(req.params.id), {
        status: req.body.status
      });
      res.json(updatedJob);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all invoices (external API)
  app.get("/api/external/invoices", authenticateApiKey, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByBusiness(req.businessId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create invoice (external API)
  app.post("/api/external/invoices", authenticateApiKey, async (req, res) => {
    try {
      // Generate invoice number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const data = insertInvoiceSchema.parse({
        ...req.body,
        businessId: req.businessId,
        invoiceNumber,
      });

      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get jobs by date range (external API)
  app.get("/api/external/jobs/calendar", authenticateApiKey, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const jobs = await storage.getJobsByDateRange(
        req.businessId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get jobs for a specific date (external API)
  app.get("/api/external/jobs/date/:date", authenticateApiKey, async (req, res) => {
    try {
      const { date } = req.params;
      const jobs = await storage.getJobsByDate(req.businessId, new Date(date));
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update job schedule (external API)
  app.patch("/api/external/jobs/:id/schedule", authenticateApiKey, async (req, res) => {
    try {
      const { scheduledStart, scheduledEnd } = req.body;

      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }

      const updateData: any = {};
      if (scheduledStart) updateData.scheduledStart = new Date(scheduledStart);
      if (scheduledEnd) updateData.scheduledEnd = new Date(scheduledEnd);

      const updatedJob = await storage.updateJob(parseInt(req.params.id), updateData);
      res.json(updatedJob);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get available time slots for scheduling (external API)
  app.get("/api/external/schedule/available-slots", authenticateApiKey, async (req, res) => {
    try {
      const { date, duration } = req.query;

      if (!date || !duration) {
        return res.status(400).json({ error: "date and duration (in hours) are required" });
      }

      const requestedDate = new Date(date as string);
      const durationHours = parseFloat(duration as string);

      // Get existing jobs for the date
      const existingJobs = await storage.getJobsByDate(req.businessId, requestedDate);

      // Generate available time slots (8 AM to 6 PM)
      const availableSlots = [];
      for (let hour = 8; hour < 18 - durationHours; hour += 0.5) {
        const slotStart = new Date(requestedDate);
        slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotEnd.getHours() + Math.floor(durationHours), slotEnd.getMinutes() + ((durationHours % 1) * 60));

        // Check if this slot conflicts with existing jobs
        const hasConflict = existingJobs.some((job: any) => {
          if (!job.scheduledStart || !job.scheduledEnd) return false;
          const jobStart = new Date(job.scheduledStart);
          const jobEnd = new Date(job.scheduledEnd);
          return (slotStart < jobEnd && slotEnd > jobStart);
        });

        if (!hasConflict) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            startTime: slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            endTime: slotEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          });
        }
      }

      res.json({ date: requestedDate.toISOString().split('T')[0], availableSlots });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update job (external API)
  app.put("/api/external/jobs/:id", authenticateApiKey, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Process the request body to handle date conversions properly
      const updateData = { ...req.body };

      // Convert date strings to Date objects if they exist
      if (updateData.scheduledStart && typeof updateData.scheduledStart === 'string') {
        updateData.scheduledStart = new Date(updateData.scheduledStart);
      }
      if (updateData.scheduledEnd && typeof updateData.scheduledEnd === 'string') {
        updateData.scheduledEnd = new Date(updateData.scheduledEnd);
      }
      if (updateData.recurringEndDate && typeof updateData.recurringEndDate === 'string') {
        updateData.recurringEndDate = new Date(updateData.recurringEndDate);
      }

      // Convert numeric fields
      if (updateData.clientId) {
        updateData.clientId = parseInt(updateData.clientId);
      }
      if (updateData.assignedUserId) {
        updateData.assignedUserId = parseInt(updateData.assignedUserId);
      }
      if (updateData.estimatedAmount) {
        updateData.estimatedAmount = parseFloat(updateData.estimatedAmount);
      }

      const updatedJob = await storage.updateJob(parseInt(req.params.id), updateData);
      res.json(updatedJob);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete job (external API)
  app.delete("/api/external/jobs/:id", authenticateApiKey, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }

      await storage.deleteJob(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single job details (external API)
  app.get("/api/external/jobs/:id", authenticateApiKey, async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job || job.businessId !== req.businessId) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Natural Language Processing endpoint for converting text to structured data
  app.post("/api/ai/process-command", authenticateApiKey, async (req, res) => {
    try {
      const { message, intent } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get business context for better processing
      const business = await storage.getBusinessById(req.businessId);
      const clients = await storage.getClientsByBusiness(req.businessId);
      const services = await storage.getServicesByBusiness(req.businessId);
      const users = await storage.getUsersByBusiness(req.businessId);

      // Create context for AI processing
      const context = {
        business: business?.name,
        clients: clients.map(c => ({ id: c.id, name: c.name, email: c.email })),
        services: services.map(s => ({ id: s.id, name: s.name, rate: s.rate })),
        users: users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, role: u.role }))
      };

      // Process the natural language input
      const processedData = await processNaturalLanguage(message, intent, context);

      res.json(processedData);
    } catch (error: any) {
      console.error("AI Processing error:", error);
      res.status(500).json({ error: "Failed to process natural language command" });
    }
  });

  // Helper function to process natural language and extract structured data
  async function processNaturalLanguage(message: string, intent: string, context: any) {
    // This is a simplified AI processing function
    // In production, you'd integrate with OpenAI, Google AI, or similar service

    const lowerMessage = message.toLowerCase();

    // Extract common patterns using regex and keywords
    const patterns = {
      // Client patterns
      clientName: /(?:for|client|customer)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|phone|email|at)/i,
      clientEmail: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      clientPhone: /(?:phone|call|number)\s*:?\s*([0-9\-\(\)\s+]{10,})/i,

      // Job/Service patterns
      jobTitle: /(?:job|work|service|task|project)\s+(?:for|on|called|titled)\s+([^,.\n]+)/i,
      serviceType: /(?:plumbing|electrical|hvac|cleaning|repair|install|maintenance|inspection)/i,

      // Date/Time patterns
      datePattern: /(?:on|for|scheduled)\s+([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?|tomorrow|today|next\s+\w+|\d{1,2}\/\d{1,2}\/?\d{0,4})/i,
      timePattern: /(?:at|around)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i,

      // Amount patterns
      amountPattern: /(?:\$|dollar|cost|charge|price|amount)\s*(\d+(?:\.\d{2})?)/i,
      hourlyRate: /(\d+(?:\.\d{2})?)\s*(?:per\s+hour|\/hour|hourly)/i,

      // Address patterns
      addressPattern: /(?:at|address|location)\s+([^,.\n]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|circle|cir|court|ct|place|pl))/i,

      // Status patterns
      urgentPattern: /(?:urgent|emergency|asap|rush|immediate)/i,
      priorityPattern: /(?:high|low|normal|medium)\s+priority/i,

      // Description patterns
      descriptionPattern: /(?:description|details|about|regarding)\s*:?\s*([^.!?]+)/i
    };

    // Extract data based on intent
    const extractedData: any = {
      intent: intent,
      confidence: 0.8, // Mock confidence score
      extractedFields: {}
    };

    // Find matching client
    const clientMatch = message.match(patterns.clientName);
    if (clientMatch) {
      const clientName = clientMatch[1].trim();
      const matchingClient = context.clients.find((c: any) => 
        c.name.toLowerCase().includes(clientName.toLowerCase()) ||
        clientName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchingClient) {
        extractedData.extractedFields.clientId = matchingClient.id;
        extractedData.extractedFields.clientName = matchingClient.name;
      } else {
        extractedData.extractedFields.newClientName = clientName;
      }
    }

    // Extract email and phone
    const emailMatch = message.match(patterns.clientEmail);
    if (emailMatch) {
      extractedData.extractedFields.email = emailMatch[1];
    }

    const phoneMatch = message.match(patterns.clientPhone);
    if (phoneMatch) {
      extractedData.extractedFields.phone = phoneMatch[1].replace(/\D/g, '');
    }

    // Extract job/service information
    const jobTitleMatch = message.match(patterns.jobTitle);
    if (jobTitleMatch) {
      extractedData.extractedFields.title = jobTitleMatch[1].trim();
    }

    // Extract service type and find matching service
    const serviceTypeMatch = message.match(patterns.serviceType);
    if (serviceTypeMatch) {
      const serviceType = serviceTypeMatch[0];
      const matchingService = context.services.find((s: any) => 
        s.name.toLowerCase().includes(serviceType.toLowerCase())
      );
      if (matchingService) {
        extractedData.extractedFields.serviceId = matchingService.id;
        extractedData.extractedFields.serviceName = matchingService.name;
        extractedData.extractedFields.rate = matchingService.rate;
      }
    }

    // Extract dates and times
    const dateMatch = message.match(patterns.datePattern);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const parsedDate = parseNaturalDate(dateStr);
      if (parsedDate) {
        extractedData.extractedFields.scheduledDate = parsedDate.toISOString().split('T')[0];
      }
    }

    const timeMatch = message.match(patterns.timePattern);
    if (timeMatch) {
      extractedData.extractedFields.scheduledTime = timeMatch[1];
    }

    // Extract amounts
    const amountMatch = message.match(patterns.amountPattern);
    if (amountMatch) {
      extractedData.extractedFields.amount = parseFloat(amountMatch[1]);
    }

    const hourlyRateMatch = message.match(patterns.hourlyRate);
    if (hourlyRateMatch) {
      extractedData.extractedFields.hourlyRate = parseFloat(hourlyRateMatch[1]);
    }

    // Extract address
    const addressMatch = message.match(patterns.addressPattern);
    if (addressMatch) {
      extractedData.extractedFields.address = addressMatch[1].trim();
    }

    // Determine priority
    if (patterns.urgentPattern.test(lowerMessage)) {
      extractedData.extractedFields.priority = 'high';
    } else if (patterns.priorityPattern.test(lowerMessage)) {
      const priorityMatch = message.match(patterns.priorityPattern);
      if (priorityMatch) {
        extractedData.extractedFields.priority = priorityMatch[1].toLowerCase();
      }
    }

    // Extract description
    const descMatch = message.match(patterns.descriptionPattern);
    if (descMatch) {
      extractedData.extractedFields.description = descMatch[1].trim();
    } else {
      // Use the entire message as description if no specific pattern found
      extractedData.extractedFields.description = message;
    }

    // Generate suggestions based on intent
    switch (intent) {
      case 'create_job':
        extractedData.suggestedAction = {
          endpoint: '/api/external/jobs',
          method: 'POST',
          payload: {
            clientId: extractedData.extractedFields.clientId,
            title: extractedData.extractedFields.title || 'New Job',
            description: extractedData.extractedFields.description,
            address: extractedData.extractedFields.address,
            priority: extractedData.extractedFields.priority || 'normal',
            status: 'scheduled',
            estimatedAmount: extractedData.extractedFields.amount?.toString()
          }
        };
        break;

      case 'create_client':
        extractedData.suggestedAction = {
          endpoint: '/api/external/clients',
          method: 'POST',
          payload: {
            name: extractedData.extractedFields.newClientName || extractedData.extractedFields.clientName,
            email: extractedData.extractedFields.email,
            phone: extractedData.extractedFields.phone,
            address: extractedData.extractedFields.address
          }
        };
        break;

      case 'create_invoice':
        extractedData.suggestedAction = {
          endpoint: '/api/external/invoices',
          method: 'POST',
          payload: {
            clientId: extractedData.extractedFields.clientId,
            items: extractedData.extractedFields.serviceName ? [
              {
                description: extractedData.extractedFields.serviceName,
                quantity: 1,
                rate: extractedData.extractedFields.rate || extractedData.extractedFields.amount || 0,
                total: extractedData.extractedFields.rate || extractedData.extractedFields.amount || 0
              }
            ] : [],
            status: 'draft'
          }
        };
        break;
    }

    return extractedData;
  }

  // Helper function to parse natural language dates
  function parseNaturalDate(dateStr: string): Date | null {
    const today = new Date();
    const lower = dateStr.toLowerCase();

    if (lower === 'today') {
      return today;
    } else if (lower === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    } else if (lower.startsWith('next ')) {
      const dayName = lower.replace('next ', '');
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(dayName);
      if (targetDay !== -1) {
        const nextDate = new Date(today);
        const currentDay = today.getDay();
        const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7;
        nextDate.setDate(today.getDate() + daysUntilTarget);
        return nextDate;
      }
    } else if (/\d{1,2}\/\d{1,2}/.test(dateStr)) {
      // Handle MM/DD or MM/DD/YYYY format
      const parts = dateStr.split('/');
      const month = parseInt(parts[0]) - 1; // Month is 0-indexed
      const day = parseInt(parts[1]);
      const year = parts[2] ? parseInt(parts[2]) : today.getFullYear();
      return new Date(year, month, day);
    }

    return null;
  }

  // Get users/team members (external API)
  app.get("/api/external/users", authenticateApiKey, async (req, res) => {
    try {
      const users = await storage.getUsersByBusiness(req.businessId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create user/team member (external API)
  app.post("/api/external/users", authenticateApiKey, async (req, res) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        businessId: req.businessId,
      });
      const user = await storage.createUser(data);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get services (external API)
  app.get("/api/external/services", authenticateApiKey, async (req, res) => {
    try {
      const services = await storage.getServicesByBusiness(req.businessId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create service (external API)
  app.post("/api/external/services", authenticateApiKey, async (req, res) => {
    try {
      const data = insertServiceSchema.parse({
        ...req.body,
        businessId: req.businessId,
      });
      const service = await storage.createService(data);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get estimates (external API)
  app.get("/api/external/estimates", authenticateApiKey, async (req, res) => {
    try {
      const estimates = await storage.getEstimatesByBusiness(req.businessId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create estimate (external API)
  app.post("/api/external/estimates", authenticateApiKey, async (req, res) => {
    try {
      // Generate unique estimate number
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
      const estimateNumber = `EST-${dateStr}-${timeStr}`;

      const data = insertEstimateSchema.parse({
        ...req.body,
        businessId: req.businessId,
        estimateNumber,
      });

      const estimate = await storage.createEstimate(data);
      res.json(estimate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update estimate (external API)
  app.put("/api/external/estimates/:id", authenticateApiKey, async (req, res) => {
    try {
      const estimate = await storage.getEstimateById(parseInt(req.params.id));
      if (!estimate || estimate.businessId !== req.businessId) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      const updateData = { ...req.body };
      if (updateData.validUntil && typeof updateData.validUntil === 'string') {
        updateData.validUntil = new Date(updateData.validUntil);
      }

      const updatedEstimate = await storage.updateEstimate(parseInt(req.params.id), updateData);
      res.json(updatedEstimate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update invoice (external API)
  app.put("/api/external/invoices/:id", authenticateApiKey, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(parseInt(req.params.id));
      if (!invoice || invoice.businessId !== req.businessId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const updatedInvoice = await storage.updateInvoice(parseInt(req.params.id), req.body);
      res.json(updatedInvoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk create jobs (external API) - useful for recurring job creation
  app.post("/api/external/jobs/bulk", authenticateApiKey, async (req, res) => {
    try {
      const { jobs } = req.body;

      if (!Array.isArray(jobs)) {
        return res.status(400).json({ error: "Jobs must be an array" });
      }

      const createdJobs = [];
      for (const jobData of jobs) {
        const job = {
          businessId: req.businessId,
          clientId: jobData.clientId,
          assignedUserId: jobData.assignedUserId || null,
          title: jobData.title,
          description: jobData.description,
          address: jobData.address || null,
          scheduledStart: jobData.scheduledStart ? new Date(jobData.scheduledStart) : null,
          scheduledEnd: jobData.scheduledEnd ? new Date(jobData.scheduledEnd) : null,
          status: jobData.status || "scheduled",
          priority: jobData.priority || "normal",
          jobType: jobData.jobType || null,
          estimatedAmount: jobData.estimatedAmount ? String(jobData.estimatedAmount) : null,
          notes: jobData.notes || null,
        };

        const createdJob = await storage.createJob(job);
        createdJobs.push(createdJob);
      }

      res.json({ created: createdJobs.length, jobs: createdJobs });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get business dashboard stats (external API)
  app.get("/api/external/dashboard/stats", authenticateApiKey, async (req, res) => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const revenue = await storage.getRevenueStats(req.businessId, currentMonth, currentYear);
      const todaysJobs = await storage.getJobsByDate(req.businessId, now);
      const recentInvoices = await storage.getInvoicesByBusiness(req.businessId);
      const teamMembers = await storage.getUsersByBusiness(req.businessId);

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

  // Webhook endpoint for n8n to receive notifications
  app.post("/api/webhook/n8n", authenticateApiKey, async (req, res) => {
    try {
      // Process webhook data from n8n
      const { event, data } = req.body;

      // Log the webhook for debugging
      console.log('Received n8n webhook:', { event, data });

      // Handle different webhook events
      switch (event) {
        case 'job_reminder':
          // Handle job reminder logic
          break;
        case 'payment_received':
          // Handle payment notification
          break;
        case 'client_follow_up':
          // Handle client follow-up
          break;
        case 'schedule_job':
          // Handle automated job scheduling
          if (data.clientId && data.title && data.scheduledStart) {
            const jobData = {
              businessId: req.businessId,
              clientId: data.clientId,
              title: data.title,
              description: data.description || '',
              scheduledStart: new Date(data.scheduledStart),
              scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
              status: data.status || "scheduled",
              priority: data.priority || "normal",
              estimatedAmount: data.estimatedAmount || null,
              notes: data.notes || null,
            };

            const job = await storage.createJob(jobData);
            return res.json({ success: true, event, job });
          }
          break;
        case 'create_recurring_jobs':
          // Handle creation of multiple recurring jobs
          if (data.template && data.dates) {
            const createdJobs = [];
            for (const date of data.dates) {
              const jobData = {
                businessId: req.businessId,
                clientId: data.template.clientId,
                title: data.template.title,
                description: data.template.description || '',
                scheduledStart: new Date(date.start),
                scheduledEnd: new Date(date.end),
                status: data.template.status || "scheduled",
                priority: data.template.priority || "normal",
                estimatedAmount: data.template.estimatedAmount || null,
                notes: data.template.notes || null,
                isRecurring: true,
                recurringFrequency: data.template.frequency,
              };

              const job = await storage.createJob(jobData);
              createdJobs.push(job);
            }
            return res.json({ success: true, event, jobs: createdJobs });
          }
          break;
        default:
          console.log('Unknown webhook event:', event);
      }

      res.json({ success: true, event, processed: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // SSE endpoint for real-time updates
  app.get("/api/sse/updates", authenticateSession, (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const businessId = req.session.businessId;
    const clientId = `client_${Date.now()}_${Math.random()}`;

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
    });

    req.on('aborted', () => {
      clearInterval(heartbeat);
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}