import express from 'express';
import { registerRoutes } from './server/routes.js';

const app = express();
app.use(express.json());

async function startServer() {
  try {
    console.log('Starting server with authentication endpoints...');
    
    const server = await registerRoutes(app);
    const port = process.env.PORT || 3000;
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log('Authentication endpoints available:');
      console.log('- POST /api/auth/business/login');
      console.log('- POST /api/auth/business/register');
      console.log('- GET /api/auth/me');
      console.log('- POST /api/auth/user/login');
      console.log('- POST /api/auth/setup');
      console.log('- POST /api/auth/logout');
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();