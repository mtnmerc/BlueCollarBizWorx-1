
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

const PORT = process.env.MCP_HTTP_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP HTTP server running on port ${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  mcpServer.kill();
  process.exit();
});
