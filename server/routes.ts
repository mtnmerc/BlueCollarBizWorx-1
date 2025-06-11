import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Helper function to extract API key from headers
const getApiKey = (req: any): string | null => {
  const headers = req.headers;
  
  // Check for X-API-Key header (preferred for ChatGPT)
  if (headers['x-api-key']) {
    return headers['x-api-key'];
  }
  
  // Check for Authorization header with Bearer token
  if (headers['authorization']) {
    const authHeader = headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  
  return null;
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ChatGPT-specific endpoints with no authentication required
  app.get('/api/gpt/test', (req, res) => {
    res.json({
      success: true,
      message: 'ChatGPT connectivity test successful',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  });

  // ChatGPT Dashboard endpoint - No authentication required
  app.get('/api/gpt/dashboard', async (req, res) => {
    try {
      const business = await storage.getBusinessByApiKey('bw_wkad606ephtmbqx7a0f');
      const clients = await storage.getClientsByBusiness(business.id);
      const jobs = await storage.getJobsByBusiness(business.id);

      res.json({
        success: true,
        data: {
          totalClients: clients.length,
          totalJobs: jobs.length,
          revenue: "0"
        },
        message: `Dashboard: ${clients.length} clients, ${jobs.length} jobs`
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: 'Server error',
        details: error.message
      });
    }
  });

  // ChatGPT Clients endpoint - No authentication required
  app.get('/api/gpt/clients', async (req, res) => {
    try {
      const business = await storage.getBusinessByApiKey('bw_wkad606ephtmbqx7a0f');
      const clientResults = await storage.getClientsByBusiness(business.id);
      
      const responseData = clientResults.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address
      }));
      
      res.json({
        success: true,
        data: responseData,
        message: `Found ${clientResults.length} clients`
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: 'Server error',
        details: error.message
      });
    }
  });

  // ChatGPT Jobs endpoint - Automatic authentication for ChatGPT
  app.get('/api/gpt/jobs', async (req, res) => {
    try {
      console.log('=== JOBS REQUEST - CHATGPT AUTO AUTH ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('User-Agent:', req.headers['user-agent']);
      console.log('Query params:', req.query);
      
      const apiKey = getApiKey(req);
      console.log('API Key provided:', apiKey ? 'YES' : 'NO');
      
      // ChatGPT authentication fallback - always use your business API key
      const targetApiKey = 'bw_wkad606ephtmbqx7a0f';
      const business = await storage.getBusinessByApiKey(targetApiKey);
      
      if (!business) {
        console.log('ERROR: Cannot access business job data');
        return res.status(500).json({ 
          success: false, 
          error: 'Business data access failed',
          message: 'Unable to retrieve job information'
        });
      }

      console.log('BUSINESS ACCESS:', business.name, 'ID:', business.id);
      
      const { date } = req.query;
      const jobResults = date ? 
        await storage.getJobsByDate(business.id, new Date(date as string)) :
        await storage.getJobsByBusiness(business.id);
      
      console.log('JOBS RETRIEVED:', jobResults.length);

      const responseData = jobResults.map((j: any) => ({
        id: j.id,
        title: j.title,
        client: j.client?.name,
        status: j.status,
        scheduledStart: j.scheduledStart,
        scheduledEnd: j.scheduledEnd,
        address: j.address
      }));

      const response = {
        success: true,
        data: responseData,
        message: `Found ${jobResults.length} jobs${date ? ` for ${date}` : ''}`
      };
      
      console.log('SENDING RESPONSE with', responseData.length, 'jobs');
      res.json(response);
    } catch (error: any) {
      console.error('Jobs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Server error',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}