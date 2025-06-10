
#!/usr/bin/env node

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());

// Start MCP server process
const mcpServer = spawn('node', [path.join(__dirname, 'mcp-server.js')], {
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

    mcpServer.stdin.write(JSON.stringify(request) + '\n');

    mcpServer.stdout.once('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      } catch (error) {
        reject(error);
      }
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
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write('data: {"jsonrpc":"2.0","method":"server/ready","params":{}}\n\n');

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
    clearInterval(keepAlive);
  });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP HTTP server running on http://0.0.0.0:${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  mcpServer.kill();
  process.exit();
});
