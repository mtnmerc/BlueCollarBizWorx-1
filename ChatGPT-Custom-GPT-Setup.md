# BizWorx ChatGPT Custom GPT Setup Guide

## Simple Setup - No Server Required

### Step 1: Start Your BizWorx App
Click the green "Run" button at the top of your Replit project. This starts your BizWorx business management app.

Your app will be accessible at: `https://bizworx-7faf4.web.app`

### Step 2: Create Your ChatGPT Custom GPT
1. Go to ChatGPT → "Explore GPTs" → "Create a GPT"
2. **Name:** BizWorx Business Assistant
3. **Description:** Voice commands for managing your blue-collar business
4. **Instructions:** Paste this:

```
You are BizWorx Business Assistant for blue-collar service businesses. You help manage clients, jobs, invoices, and revenue through natural conversation.

When users speak, understand their intent:
- "Add client" or "new customer" → use createClient
- "Schedule job" or "book appointment" → use createJob  
- "Show jobs" or "what's my schedule" → use getJobs
- "Create invoice" or "bill customer" → use createInvoice
- "Revenue" or "how much money" → use getRevenue

Always confirm what you created and provide helpful summaries.
```

### Step 3: Add Actions
In the Actions section:
- **Authentication:** API Key
- **Header:** X-API-Key  
- **Schema:** Use the corrected schema from `bizworx-chatgpt-fixed.json` with your running app URL

### Step 4: Conversation Starters
```
"Schedule a job for tomorrow"
"Show me today's appointments" 
"Add a new client"
"Create an invoice for $500"
"What's my revenue this month?"
```

### Step 5: Testing Commands

Once configured, test with these voice/text commands:

**Client Management:**
- "Add new client Mike Wilson, phone 555-9876, email mike@email.com"
- "Show me all my clients"
- "Find client John Smith"

**Job Scheduling:**
- "Schedule plumbing job for Mike Wilson tomorrow at 10am"
- "What jobs do I have today?"
- "Show me this week's schedule"

**Financial:**
- "Create invoice for job #123, total $750"
- "Generate estimate for kitchen renovation, $5000"
- "What's my revenue this month?"

**Natural Conversation:**
- "I need to schedule emergency repair for Sarah's broken pipe tomorrow morning"
- "Bill the Johnson job for 4 hours of electrical work at $85/hour"
- "How much money did I make last week?"

## API Key Setup

Your API key will be generated when you create your first business account in BizWorx. 

For production:
- Use: `https://bizworx-7faf4.web.app` as base URL
- Get your API key from business settings after creating your account

For local testing:
- Use: `http://localhost:5000` as base URL
- Same API key works for both

## Benefits

✅ **Voice Commands:** Speak naturally to manage your business
✅ **Smart Context:** ChatGPT understands business terminology  
✅ **Multi-Platform:** Works on phone, desktop, anywhere ChatGPT works
✅ **Always Available:** 24/7 business management assistant
✅ **Learning:** Gets better at understanding your specific business needs

## Example Business Day

**Morning:** "What's my schedule today?"
**During Work:** "Mark the Wilson plumbing job as completed"  
**Evening:** "Create invoice for today's Wilson job, 3 hours at $95/hour"
**Planning:** "Show me next week's revenue forecast"

Your business management is now as simple as having a conversation!