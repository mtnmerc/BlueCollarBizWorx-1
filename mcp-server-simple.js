import express from 'express';

const app = express();
app.use(express.json());

// Base URL for BizWorx API
const BIZWORX_BASE_URL = 'https://bizworx-7faf4.web.app';

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

// Direct API call to BizWorx
async function callBizWorxAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BIZWORX_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': options.apiKey,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('BizWorx API Error:', error);
    throw error;
  }
}

// Execute tool endpoint
app.post('/execute', async (req, res) => {
  try {
    const { tool, apiKey, ...params } = req.body;

    if (!tool || !apiKey) {
      return res.status(400).json({ error: 'Tool and API key required' });
    }

    const toolConfig = toolMap[tool];
    if (!toolConfig) {
      return res.status(404).json({ error: `Tool ${tool} not found` });
    }

    let endpoint = toolConfig.endpoint;
    let body = params;

    // Handle special cases
    if (tool === 'update_job_status' && params.jobId) {
      endpoint = endpoint.replace('{id}', params.jobId);
      body = { status: params.status };
    }

    const result = await callBizWorxAPI(endpoint, {
      method: toolConfig.method,
      apiKey,
      body: toolConfig.method !== 'GET' ? body : undefined
    });

    res.json({ success: true, tool, result });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'BizWorx Internal MCP Server',
    timestamp: new Date().toISOString()
  });
});

// List tools
app.get('/tools', (req, res) => {
  res.json({ tools: Object.keys(toolMap) });
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔧 Internal MCP Server running on localhost:${PORT}`);
});
