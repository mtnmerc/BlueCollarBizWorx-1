
#!/usr/bin/env node

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

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
  res.write('data: {"type":"connection","status":"connected"}\n\n');

  // Handle MCP protocol messages via SSE
  const handleMCPMessage = async (data) => {
    try {
      const message = JSON.parse(data);
      if (message.method === 'tools/call') {
        const result = await callMCPTool(message.params.name, message.params.arguments);
        const response = {
          jsonrpc: '2.0',
          id: message.id,
          result: result
        };
        res.write(`data: ${JSON.stringify(response)}\n\n`);
      }
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: message?.id || null,
        error: { code: -32603, message: error.message }
      };
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    }
  };

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE client disconnected');
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

const PORT = process.env.MCP_HTTP_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP HTTP server running on port ${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  mcpServer.kill();
  process.exit();
});
