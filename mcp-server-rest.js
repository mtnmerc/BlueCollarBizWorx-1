
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Base URL for BizWorx API
const BIZWORX_BASE_URL = 'https://BluecollarBizWorx.replit.app';

// Helper function to make requests to BizWorx API
async function callBizWorxAPI(endpoint, options = {}) {
  const url = `${BIZWORX_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'BizWorx REST MCP Server',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// List available tools
app.get('/tools', (req, res) => {
  const tools = [
    {
      name: 'get_clients',
      description: 'Get list of all clients',
      parameters: {
        apiKey: 'string (required)'
      }
    },
    {
      name: 'create_client',
      description: 'Create a new client',
      parameters: {
        apiKey: 'string (required)',
        name: 'string (required)',
        email: 'string (required)',
        phone: 'string (optional)',
        address: 'string (optional)'
      }
    },
    {
      name: 'get_jobs',
      description: 'Get list of jobs',
      parameters: {
        apiKey: 'string (required)',
        date: 'string (optional) - YYYY-MM-DD format'
      }
    },
    {
      name: 'create_job',
      description: 'Create a new job',
      parameters: {
        apiKey: 'string (required)',
        clientId: 'number (required)',
        title: 'string (required)',
        description: 'string (optional)',
        scheduledStart: 'string (optional) - ISO format',
        scheduledEnd: 'string (optional) - ISO format'
      }
    },
    {
      name: 'get_invoices',
      description: 'Get list of invoices',
      parameters: {
        apiKey: 'string (required)'
      }
    },
    {
      name: 'create_invoice',
      description: 'Create a new invoice',
      parameters: {
        apiKey: 'string (required)',
        clientId: 'number (required)',
        title: 'string (required)',
        lineItems: 'array (required)',
        total: 'string (required)'
      }
    },
    {
      name: 'update_job_status',
      description: 'Update job status',
      parameters: {
        apiKey: 'string (required)',
        jobId: 'number (required)',
        status: 'string (required) - scheduled, in_progress, completed, cancelled'
      }
    },
    {
      name: 'get_revenue_stats',
      description: 'Get revenue statistics',
      parameters: {
        apiKey: 'string (required)',
        month: 'number (optional)',
        year: 'number (optional)'
      }
    }
  ];

  res.json({ tools });
});

// Execute tool endpoint
app.post('/execute/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const { apiKey, ...params } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    let result;

    switch (toolName) {
      case 'get_clients':
        result = await callBizWorxAPI('/api/external/clients', { apiKey });
        break;

      case 'create_client':
        result = await callBizWorxAPI('/api/external/clients', {
          method: 'POST',
          apiKey,
          body: {
            name: params.name,
            email: params.email,
            phone: params.phone,
            address: params.address
          }
        });
        break;

      case 'get_jobs':
        let endpoint = '/api/external/jobs';
        if (params.date) {
          endpoint = `/api/external/jobs/date/${params.date}`;
        }
        result = await callBizWorxAPI(endpoint, { apiKey });
        break;

      case 'create_job':
        result = await callBizWorxAPI('/api/external/jobs', {
          method: 'POST',
          apiKey,
          body: {
            clientId: params.clientId,
            title: params.title,
            description: params.description,
            scheduledStart: params.scheduledStart,
            scheduledEnd: params.scheduledEnd
          }
        });
        break;

      case 'get_invoices':
        result = await callBizWorxAPI('/api/external/invoices', { apiKey });
        break;

      case 'create_invoice':
        result = await callBizWorxAPI('/api/external/invoices', {
          method: 'POST',
          apiKey,
          body: {
            clientId: params.clientId,
            title: params.title,
            lineItems: params.lineItems,
            subtotal: params.total,
            total: params.total
          }
        });
        break;

      case 'update_job_status':
        result = await callBizWorxAPI(`/api/external/jobs/${params.jobId}`, {
          method: 'PATCH',
          apiKey,
          body: {
            status: params.status
          }
        });
        break;

      case 'get_revenue_stats':
        const now = new Date();
        const month = params.month || now.getMonth() + 1;
        const year = params.year || now.getFullYear();
        result = await callBizWorxAPI(`/api/external/revenue?month=${month}&year=${year}`, { apiKey });
        break;

      default:
        return res.status(400).json({ error: `Unknown tool: ${toolName}` });
    }

    res.json({
      success: true,
      tool: toolName,
      result: result
    });

  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      tool: req.params.toolName
    });
  }
});

// Simplified webhook endpoint for N8N
app.post('/webhook', async (req, res) => {
  try {
    const { tool, apiKey, ...params } = req.body;

    if (!tool || !apiKey) {
      return res.status(400).json({ error: 'Tool name and API key are required' });
    }

    // Forward to execute endpoint
    const executeUrl = `/execute/${tool}`;
    const executeBody = { apiKey, ...params };

    // Internal call to execute endpoint
    const result = await new Promise((resolve, reject) => {
      const mockReq = {
        params: { toolName: tool },
        body: executeBody
      };

      const mockRes = {
        json: (data) => resolve(data),
        status: (code) => ({
          json: (data) => reject(new Error(`${code}: ${JSON.stringify(data)}`))
        })
      };

      // Execute the tool logic
      app._router.handle(mockReq, mockRes);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 BizWorx REST MCP Server running on ${HOST}:${PORT}`);
  console.log(`📋 Health check: https://BluecollarBizWorx.replit.app:${PORT}/health`);
  console.log(`🔧 Tools list: https://BluecollarBizWorx.replit.app:${PORT}/tools`);
  console.log(`⚡ Execute endpoint: https://BluecollarBizWorx.replit.app:${PORT}/execute/{toolName}`);
  console.log(`🔗 Webhook endpoint: https://BluecollarBizWorx.replit.app:${PORT}/webhook`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down REST MCP server...');
  process.exit(0);
});
