import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PROXY_PORT || 3001;
const BIZWORX_API_BASE = process.env.BIZWORX_API_BASE || 'http://localhost:5000/api/gpt';

// Enable CORS for ChatGPT
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.url}`);
  console.log(`[PROXY] Body:`, req.body ? JSON.stringify(req.body, null, 2) : 'No body');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'BizWorx ChatGPT Proxy',
    timestamp: new Date().toISOString() 
  });
});

// Proxy middleware for all BizWorx API endpoints
app.all('/api/gpt/*', async (req, res) => {
  try {
    console.log(`[PROXY] Processing request to ${req.path}`);
    
    // Extract API key from request body
    const apiKey = req.body?.api_key || req.query?.api_key;
    
    if (!apiKey) {
      console.log('[PROXY] No API key provided in request');
      return res.status(400).json({
        success: false,
        error: 'API key required. Please provide your BizWorx API key in the request body as "api_key"'
      });
    }
    
    console.log(`[PROXY] Using API key: ${apiKey.substring(0, 8)}...`);
    
    // Remove api_key from body before forwarding
    const forwardBody = { ...req.body };
    delete forwardBody.api_key;
    
    // Build target URL
    const targetPath = req.path; // /api/gpt/clients
    const targetUrl = `${BIZWORX_API_BASE.replace('/api/gpt', '')}${targetPath}`;
    
    console.log(`[PROXY] Forwarding to: ${targetUrl}`);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    };
    
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: headers
    };
    
    // Add body for non-GET requests
    if (req.method !== 'GET' && Object.keys(forwardBody).length > 0) {
      fetchOptions.body = JSON.stringify(forwardBody);
    }
    
    console.log(`[PROXY] Fetch options:`, {
      ...fetchOptions,
      headers: { ...fetchOptions.headers, 'X-API-Key': '***' }
    });
    
    // Make request to BizWorx API
    const response = await fetch(targetUrl, fetchOptions);
    const responseData = await response.json();
    
    console.log(`[PROXY] BizWorx API responded with status: ${response.status}`);
    console.log(`[PROXY] Response data:`, JSON.stringify(responseData, null, 2));
    
    // Forward the response
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Proxy server error',
      details: error.message
    });
  }
});

// Catch-all for non-API routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'This proxy only handles /api/gpt/* endpoints'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PROXY] BizWorx ChatGPT Proxy running on port ${PORT}`);
  console.log(`[PROXY] Forwarding requests to: ${BIZWORX_API_BASE}`);
  console.log(`[PROXY] Health check: http://localhost:${PORT}/health`);
});

export default app;