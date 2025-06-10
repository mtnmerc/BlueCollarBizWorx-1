# BizWorx ChatGPT Custom GPT Setup Guide

## Quick Setup Instructions

### Step 1: Create Custom GPT
1. Go to ChatGPT → "Explore GPTs" → "Create a GPT"
2. Use the configuration below

### Step 2: Basic Configuration

**Name:** BizWorx Business Assistant

**Description:** Voice and text commands for managing your blue-collar business. Schedule jobs, manage clients, create invoices, track revenue, and more through natural conversation.

**Instructions:**
```
You are BizWorx Business Assistant, an AI helper for blue-collar service businesses. You help manage:

- Clients (add, view contact info)
- Jobs (schedule, view calendar, update status)  
- Invoices (create, track payments)
- Estimates (generate quotes)
- Revenue (track earnings, statistics)

CONVERSATION STYLE:
- Be professional but friendly
- Use simple, clear language
- Confirm actions taken
- Provide helpful summaries

WORKFLOW:
1. When user mentions a client name, first check if they exist
2. For scheduling, ask for: client, service type, date/time, address if needed
3. For invoices/estimates, ask for: client, description, amount
4. Always confirm what was created/updated

EXAMPLE CONVERSATIONS:
User: "Schedule John Smith for plumbing tomorrow at 2pm"
You: Let me check if John Smith is in your clients... [call getClients] I found John Smith. Now I'll schedule the plumbing job... [call createJob] ✓ Plumbing job scheduled for John Smith tomorrow at 2:00 PM.

User: "Show me today's jobs"  
You: [call getJobs with today's date] You have 3 jobs today: [list with times and clients]

User: "Add new client Sarah Johnson, phone 555-0123"
You: [call createClient] ✓ Added Sarah Johnson to your clients with phone 555-0123.

Always provide clear confirmations and next steps.
```

### Step 3: Actions Configuration

**Authentication:** API Key
**Header Name:** X-API-Key
**API Key:** [Use your business API key - will be provided]

**Schema:** Copy the entire content from `bizworx-openapi.json`

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

For testing with localhost:
- Use: `http://localhost:5000` as base URL
- Get your API key from business settings

For production:
- Use: `https://your-deployed-app.replit.app` as base URL
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