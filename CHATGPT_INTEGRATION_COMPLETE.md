# ChatGPT Custom GPT Integration - Complete Backup

## CRITICAL FILES FOR CHATGPT INTEGRATION

### 1. Server Routes (server/routes.ts)
**Lines 400-600** - GPT API endpoints that MUST be preserved:

```typescript
// ChatGPT Custom GPT API endpoints
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
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clients',
      details: error.message 
    });
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
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch jobs',
      details: error.message 
    });
  }
});

app.get('/api/gpt/dashboard', authenticateGPT, async (req, res) => {
  try {
    const business = req.business;
    const clients = await storage.getClientsByBusiness(business.id);
    const jobs = await storage.getJobsByBusiness(business.id);
    
    const revenue = jobs.reduce((total, job) => {
      return total + (parseFloat(job.total || '0'));
    }, 0);
    
    res.json({
      success: true,
      data: {
        totalClients: clients.length,
        totalJobs: jobs.length,
        revenue: revenue.toString()
      },
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
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
});

app.get('/api/gpt/test', authenticateGPT, async (req, res) => {
  res.json({
    success: true,
    message: "BizWorx API connectivity test successful",
    timestamp: new Date().toISOString(),
    version: "2.1.0"
  });
});

// GPT Authentication middleware
function authenticateGPT(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required in X-API-Key header'
    });
  }
  
  storage.getBusinessByApiKey(apiKey)
    .then(business => {
      if (!business) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        });
      }
      
      req.business = business;
      next();
    })
    .catch(error => {
      console.error('Error authenticating API key:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    });
}
```

### 2. API Key in Database
**CRITICAL**: Business ID 1 must have API key: `bw_wkad606ephtmbqx7a0f`

### 3. Storage Methods Required
**File: server/storage.ts**

```typescript
async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
  const [result] = await db.select().from(businesses).where(eq(businesses.apiKey, apiKey));
  return result || null;
}

async getClientsByBusiness(businessId: number): Promise<Client[]> {
  return await db
    .select()
    .from(clients)
    .where(eq(clients.businessId, businessId))
    .orderBy(desc(clients.createdAt));
}

async getJobsByBusiness(businessId: number): Promise<Job[]> {
  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.businessId, businessId))
    .orderBy(desc(jobs.scheduledStart));
}
```

## CHATGPT CUSTOM GPT CONFIGURATION

### Schema Files to Preserve:
1. `chatgpt-clients-tools.json`
2. `chatgpt-jobs-tools.json` 
3. `chatgpt-dashboard-tools.json`

### Working API Endpoints:
- `https://bluecollarbizworx.replit.app/api/gpt/clients`
- `https://bluecollarbizworx.replit.app/api/gpt/jobs`
- `https://bluecollarbizworx.replit.app/api/gpt/dashboard`
- `https://bluecollarbizworx.replit.app/api/gpt/test`

### Authentication:
- Header: `X-API-Key: bw_wkad606ephtmbqx7a0f`

## COPY-PASTE RESTORATION INSTRUCTIONS

After rollback, follow these exact steps:

1. **Add GPT endpoints to server/routes.ts** (append at end before `return httpServer;`):
```typescript
// ChatGPT Custom GPT API endpoints - DO NOT MODIFY
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

app.get('/api/gpt/test', authenticateGPT, async (req, res) => {
  res.json({
    success: true,
    message: "BizWorx API connectivity test successful",
    timestamp: new Date().toISOString(),
    version: "2.1.0"
  });
});
```

2. **Ensure storage.ts has getBusinessByApiKey method**:
```typescript
async getBusinessByApiKey(apiKey: string): Promise<Business | null> {
  const [result] = await db.select().from(businesses).where(eq(businesses.apiKey, apiKey));
  return result || null;
}
```

3. **Verify API key in database**:
Run: `UPDATE businesses SET api_key = 'bw_wkad606ephtmbqx7a0f' WHERE id = 1;`

4. **Test with**:
```bash
curl -H "X-API-Key: bw_wkad606ephtmbqx7a0f" https://bluecollarbizworx.replit.app/api/gpt/test
```

## CURRENT WORKING STATE
- 10 clients preserved
- 8 jobs preserved  
- Business "Flatline earthworks" (ID: 1)
- API key: bw_wkad606ephtmbqx7a0f
- All data verified authentic and working