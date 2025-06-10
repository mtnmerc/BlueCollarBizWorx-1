# ChatGPT Custom GPT Setup - Working Solution

## Problem: Deployment Routing Issues
Your Replit deployment at `https://bluecollarbizworx.replit.app` returns 404 for external requests due to routing configuration issues.

## Solution: Local Development + Ngrok Tunnel

### Step 1: Start Your Local Server
```bash
# In your Replit console
npm run dev
```
This starts your server on `http://localhost:5000`

### Step 2: Create Public Tunnel (Option A - Ngrok)
If you have ngrok installed:
```bash
ngrok http 5000
```
This gives you a public URL like: `https://abc123.ngrok.io`

### Step 2: Alternative - Replit Port Forwarding (Option B)
Replit automatically exposes port 5000. Check your Replit console for the URL format:
`https://5000-yourusername-projectname.replit.dev`

### Step 3: Update ChatGPT Schema
Use the content from `bizworx-chatgpt-fixed.json` but replace the server URL:

```json
"servers": [
  {
    "url": "https://abc123.ngrok.io"
  }
]
```

### Step 4: Test Commands
Once configured, test these voice commands:
- "Add new client John Smith, phone 555-1234"
- "Schedule plumbing job for John tomorrow at 2 PM"
- "Show me today's jobs"
- "Create invoice for $750"

## Alternative: Use Localhost for Testing
If you're running ChatGPT on the same machine as your Replit, you can use:
- Server URL: `http://localhost:5000`
- This works for desktop testing but not mobile

## API Endpoints Available
- GET /gpt/clients - List all clients
- POST /gpt/clients - Create new client
- GET /gpt/jobs - List jobs (optional date filter)
- POST /gpt/jobs - Schedule new job
- POST /gpt/invoices - Create invoice
- GET /gpt/revenue - Revenue statistics

## Authentication
- Type: API Key
- Header: X-API-Key
- Value: Get from your BizWorx business settings

## Next Steps
1. Start your local server
2. Get a public URL (ngrok or Replit forwarding)
3. Update the schema with your public URL
4. Test voice commands in ChatGPT

Your voice-controlled business management is ready!