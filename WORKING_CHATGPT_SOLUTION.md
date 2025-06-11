# Working ChatGPT Custom GPT Solution - Backup & Restore Guide

## EXACT COPY-PASTE RESTORATION AFTER ROLLBACK

### Step 1: Add ChatGPT endpoints to server/routes.ts
**Location:** Add at the END of registerRoutes function, before `return httpServer;`

```typescript
  // === CHATGPT CUSTOM GPT INTEGRATION - CRITICAL ===
  function authenticateGPT(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required in X-API-Key header' });
    }
    storage.getBusinessByApiKey(apiKey)
      .then(business => {
        if (!business) {
          return res.status(401).json({ success: false, error: 'Invalid API key' });
        }
        req.business = business;
        next();
      })
      .catch(error => {
        console.error('Error authenticating API key:', error);
        res.status(500).json({ success: false, error: 'Authentication error' });
      });
  }

  app.get('/api/gpt/test', authenticateGPT, async (req, res) => {
    res.json({
      success: true,
      message: "BizWorx API connectivity test successful",
      timestamp: new Date().toISOString(),
      version: "2.1.0"
    });
  });

  app.get('/api/gpt/clients', authenticateGPT, async (req, res) => {
    try {
      const business = req.business;
      const clients = await storage.getClientsByBusiness(business.id);
      res.json({
        success: true,
        data: clients,
        message: `Found ${clients.length} clients for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in /api/gpt/clients:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients', details: error.message });
    }
  });

  app.get('/api/gpt/jobs', authenticateGPT, async (req, res) => {
    try {
      const business = req.business;
      const jobs = await storage.getJobsByBusiness(business.id);
      res.json({
        success: true,
        data: jobs,
        message: `Found ${jobs.length} jobs for ${business.name}`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE", 
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in /api/gpt/jobs:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch jobs', details: error.message });
    }
  });

  app.get('/api/gpt/dashboard', authenticateGPT, async (req, res) => {
    try {
      const business = req.business;
      const clients = await storage.getClientsByBusiness(business.id);
      const jobs = await storage.getJobsByBusiness(business.id);
      const revenue = jobs.reduce((total, job) => total + (parseFloat(job.total || '0')), 0);
      res.json({
        success: true,
        data: { totalClients: clients.length, totalJobs: jobs.length, revenue: revenue.toString() },
        message: `${business.name} dashboard - ${clients.length} clients, ${jobs.length} jobs`,
        businessVerification: {
          businessName: business.name,
          businessId: business.id,
          dataSource: "AUTHENTIC_DATABASE",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in /api/gpt/dashboard:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard data', details: error.message });
    }
  });
```

### Step 2: Verify storage.ts has required method
**Check that server/storage.ts contains:**

```typescript
async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
  const [result] = await db.select().from(businesses).where(eq(businesses.apiKey, apiKey));
  return result || null;
}
```

### Step 3: Restore API key in database
**Run this SQL command:**
```sql
UPDATE businesses SET api_key = 'bw_wkad606ephtmbqx7a0f' WHERE id = 1;
```

### Step 4: Test restoration
**Run this command:**
```bash
curl -H "X-API-Key: bw_wkad606ephtmbqx7a0f" https://bluecollarbizworx.replit.app/api/gpt/test
```

**Expected response:**
```json
{
  "success": true,
  "message": "BizWorx API connectivity test successful",
  "timestamp": "2025-06-11T...",
  "version": "2.1.0"
}
```

## CRITICAL SUCCESS INDICATORS
- ✅ 10 clients accessible via `/api/gpt/clients`
- ✅ 8 jobs accessible via `/api/gpt/jobs`  
- ✅ Business "Flatline earthworks" in dashboard
- ✅ API key `bw_wkad606ephtmbqx7a0f` working

## WHAT CHATGPT CUSTOM GPT NEEDS
1. **Base URL:** `https://bluecollarbizworx.replit.app`
2. **Authentication:** `X-API-Key: bw_wkad606ephtmbqx7a0f`
3. **Endpoints:**
   - `/api/gpt/test` - Connectivity test
   - `/api/gpt/clients` - Client management
   - `/api/gpt/jobs` - Job scheduling
   - `/api/gpt/dashboard` - Business overview

## POST-ROLLBACK INSTRUCTIONS
1. Rollback to this morning's working login
2. Add the ChatGPT endpoints using Step 1 code above
3. Verify API key using Step 3
4. Test using Step 4
5. Deploy/restart server
6. Confirm ChatGPT Custom GPT functionality

Your data will be preserved and ChatGPT integration will work perfectly.