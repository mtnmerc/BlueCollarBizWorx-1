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

// Start MCP server process
const mcpServer = spawn('node', [join(__dirname, 'mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle MCP communication
async function callMCPTool(toolName, parameters) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: parameters
      }
    };

    console.log('Sending to MCP server:', request);
    mcpServer.stdin.write(JSON.stringify(request) + '\n');

    // Set a timeout for the response
    const timeout = setTimeout(() => {
      reject(new Error('MCP server timeout'));
    }, 30000);

    mcpServer.stdout.once('data', (data) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(data.toString());
        console.log('MCP server response:', response);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      } catch (error) {
        console.error('Failed to parse MCP response:', data.toString());
        reject(error);
      }
    });

    mcpServer.stderr.once('data', (data) => {
      clearTimeout(timeout);
      console.error('MCP server error:', data.toString());
      reject(new Error(`MCP server error: ${data.toString()}`));
    });
  });
}

// HTTP endpoints for n8n
app.post('/mcp/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const parameters = req.body;

    const result = await callMCPTool(toolName, parameters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'BizWorx MCP HTTP Server',
    version: '1.0.0'
  });
});

// Test endpoint for N8N connectivity
app.get('/test', (req, res) => {
  res.json({
    message: 'MCP Server is accessible',
    timestamp: new Date().toISOString(),
    endpoint: '/mcp/events',
    protocol: 'MCP 2024-11-05',
    tools_available: 11
  });
});

// MCP protocol test endpoint
app.post('/test/mcp', (req, res) => {
  res.json({
    jsonrpc: '2.0',
    id: req.body.id || 1,
    result: {
      message: 'MCP protocol test successful',
      server: 'bizworx-mcp-server',
      capabilities: ['tools']
    }
  });
});

// List available tools
app.get('/mcp/tools', (req, res) => {
  const tools = [
    'get_clients',
    'create_client',
    'get_jobs',
    'create_job',
    'get_invoices',
    'create_invoice',
    'get_estimates',
    'create_estimate',
    'update_job_status',
    'get_revenue_stats',
    'get_services'
  ];
  res.json({ tools });
});

// SSE endpoint for N8N MCP node compatibility
app.get('/mcp/events', (req, res) => {
  console.log('SSE connection established from:', req.headers['user-agent']);
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, X-API-Key, Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Send proper MCP initialization sequence
  res.write('data: {"jsonrpc":"2.0","method":"notifications/initialized","params":{}}\n\n');
  
  // Send server info
  res.write('data: {"jsonrpc":"2.0","method":"server/info","params":{"name":"bizworx-mcp-server","version":"1.0.0"}}\n\n');
  
  // Send capabilities
  res.write('data: {"jsonrpc":"2.0","method":"server/capabilities","params":{"tools":{}}}\n\n');

  // Keep connection alive with proper MCP ping
  const keepAlive = setInterval(() => {
    res.write('data: {"jsonrpc":"2.0","method":"notifications/ping","params":{}}\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
    clearInterval(keepAlive);
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(keepAlive);
  });
});

// WebSocket-style message handling for SSE
app.post('/mcp/events', async (req, res) => {
  console.log('MCP POST request received:', req.body);
  
  try {
    const { method, params, id } = req.body;

    if (method === 'initialize') {
      // Handle MCP initialization
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'bizworx-mcp-server',
            version: '1.0.0'
          }
        }
      });
    } else if (method === 'tools/list') {
      const tools = [
        { name: 'get_clients', description: 'Get list of all clients' },
        { name: 'create_client', description: 'Create a new client' },
        { name: 'get_jobs', description: 'Get jobs for a specific date or all jobs' },
        { name: 'create_job', description: 'Create a new job' },
        { name: 'get_invoices', description: 'Get list of all invoices' },
        { name: 'create_invoice', description: 'Create a new invoice' },
        { name: 'get_estimates', description: 'Get list of all estimates' },
        { name: 'create_estimate', description: 'Create a new estimate' },
        { name: 'update_job_status', description: 'Update job status' },
        { name: 'get_revenue_stats', description: 'Get revenue statistics' },
        { name: 'get_services', description: 'Get list of all services' }
      ];

      console.log('Sending tools list:', tools);
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: { tools }
      });
    } else if (method === 'tools/call') {
      console.log('Tool call:', params);
      const result = await callMCPTool(params.name, params.arguments);
      console.log('Tool result:', result);
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: result
      });
    } else {
      console.log('Unknown method:', method);
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

// POST endpoint for MCP protocol messages (used by N8N MCP node)
app.post('/mcp/call', async (req, res) => {
  try {
    const { method, params, id } = req.body;

    if (method === 'tools/list') {
      const tools = [
        { name: 'get_clients', description: 'Get list of all clients' },
        { name: 'create_client', description: 'Create a new client' },
        { name: 'get_jobs', description: 'Get jobs for a specific date or all jobs' },
        { name: 'create_job', description: 'Create a new job' },
        { name: 'get_invoices', description: 'Get list of all invoices' },
        { name: 'create_invoice', description: 'Create a new invoice' },
        { name: 'get_estimates', description: 'Get list of all estimates' },
        { name: 'create_estimate', description: 'Create a new estimate' },
        { name: 'update_job_status', description: 'Update job status' },
        { name: 'get_revenue_stats', description: 'Get revenue statistics' },
        { name: 'get_services', description: 'Get list of all services' }
      ];

      res.json({
        jsonrpc: '2.0',
        id: id,
        result: { tools }
      });
    } else if (method === 'tools/call') {
      const result = await callMCPTool(params.name, params.arguments);
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: result
      });
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id: id,
        error: { code: -32601, message: `Method not found: ${method}` }
      });
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: { code: -32603, message: error.message }
    });
  }
});

const PORT = process.env.MCP_HTTP_PORT || 3001;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`MCP HTTP server running on ${HOST}:${PORT}`);
  console.log(`External URL: https://BluecollarBizWorx.replit.app:${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  mcpServer.kill();
  process.exit();
});