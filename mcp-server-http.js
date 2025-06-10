import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, X-API-Key, Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Store active connections for SSE
const activeConnections = new Set();

// Direct API call to BizWorx instead of relying on MCP subprocess
async function callBizWorxAPI(endpoint, options = {}) {
  const baseUrl = 'https://BluecollarBizWorx.replit.app'; // Use correct URL

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
}

// Tool mapping
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

// HTTP endpoints for n8n
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'BizWorx MCP HTTP Server',
    version: '1.0.0',
    url: 'https://BluecollarBizWorx.replit.app:3002'
  });
});

// Test endpoint for N8N connectivity
app.get('/test', (req, res) => {
  res.json({
    message: 'MCP Server is accessible',
    timestamp: new Date().toISOString(),
    endpoint: '/mcp/events',
    protocol: 'MCP 2024-11-05',
    tools_available: Object.keys(toolMap).length,
    correct_url: 'https://BluecollarBizWorx.replit.app:3002'
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

function getToolDescription(toolName) {
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
}

// SSE endpoint for N8N MCP node compatibility
app.get('/mcp/events', (req, res) => {
  console.log('SSE connection established from:', req.headers['user-agent']);
  console.log('SSE Headers:', req.headers);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, X-API-Key, Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Add to active connections
  activeConnections.add(res);

  // Send initial MCP handshake
  const sendMessage = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // MCP initialization sequence
  sendMessage({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {}
  });

  setTimeout(() => {
    sendMessage({
      jsonrpc: "2.0",
      method: "server/capabilities",
      params: {
        tools: {},
        resources: {},
        prompts: {}
      }
    });
  }, 100);

  setTimeout(() => {
    sendMessage({
      jsonrpc: "2.0",
      method: "server/info",
      params: {
        name: "bizworx-mcp-server",
        version: "1.0.0",
        protocolVersion: "2024-11-05"
      }
    });
  }, 200);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    sendMessage({
      jsonrpc: "2.0",
      method: "notifications/ping",
      params: { timestamp: Date.now() }
    });
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
    activeConnections.delete(res);
    clearInterval(keepAlive);
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    activeConnections.delete(res);
    clearInterval(keepAlive);
  });
});

// POST endpoint for MCP protocol messages
app.post('/mcp/events', async (req, res) => {
  console.log('MCP POST request received:', JSON.stringify(req.body, null, 2));

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

// Alternative call endpoint
app.post('/mcp/call', async (req, res) => {
  // Redirect to /mcp/events for consistency
  req.url = '/mcp/events';
  return app._router.handle(req, res);
});

const PORT = process.env.MCP_HTTP_PORT || 3002;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`MCP HTTP server running on ${HOST}:${PORT}`);
  console.log(`External URL: https://BluecollarBizWorx.replit.app:${PORT}`);
  console.log(`Health check: https://BluecollarBizWorx.replit.app:${PORT}/health`);
  console.log(`Test endpoint: https://BluecollarBizWorx.replit.app:${PORT}/test`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MCP HTTP server...');
  activeConnections.forEach(res => {
    try {
      res.end();
    } catch (e) {
      // Connection already closed
    }
  });
  process.exit(0);
});