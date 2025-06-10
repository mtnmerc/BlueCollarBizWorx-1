import express from 'express';

const app = express();
const port = 3001;

// Simple test server to verify header handling
app.use(express.json());

app.get('/test-headers', (req, res) => {
  console.log('=== HEADER TEST ===');
  console.log('Raw headers:', JSON.stringify(req.headers, null, 2));
  console.log('x-api-key:', req.headers['x-api-key']);
  console.log('X-API-Key:', req.headers['X-API-Key']);
  console.log('authorization:', req.headers.authorization);
  
  const xApiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;
  
  let apiKey = null;
  if (xApiKey && typeof xApiKey === 'string') {
    apiKey = xApiKey;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.replace('Bearer ', '');
  }
  
  res.json({
    success: true,
    apiKey: apiKey,
    headers: {
      'x-api-key': req.headers['x-api-key'],
      'authorization': req.headers.authorization
    }
  });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});