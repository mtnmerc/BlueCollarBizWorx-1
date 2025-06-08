# BizWorx MCP Server Setup Guide

This guide shows you how to set up voice commands for your BizWorx business management app using Telegram, N8N, and the Model Context Protocol (MCP) server.

## What You'll Need

1. **Your BizWorx API Key** - Get this from your Business Settings page in the app
2. **Telegram Bot Token** - Create a bot using @BotFather on Telegram
3. **OpenAI API Key** - For speech-to-text and intent recognition
4. **N8N Instance** - Self-hosted or cloud instance
5. **Node.js** - To run the MCP server

## Step 1: Get Your BizWorx API Key

1. Log into your BizWorx app
2. Go to Business Settings
3. Find the "API Integration" section
4. Click "Generate API Key" if you don't have one
5. Copy your API key (starts with `bw_`)

## Step 2: Set Up the MCP Server

The MCP server is already created in your project root as `mcp-server.js`. To test it:

```bash
# Test the MCP server
node mcp-server.js
```

The server will run on stdio and wait for MCP protocol messages.

## Step 3: Create a Telegram Bot

1. Open Telegram and message @BotFather
2. Send `/newbot`
3. Choose a name for your bot (e.g., "MyBusiness Voice Assistant")
4. Choose a username (must end in 'bot', e.g., "mybusiness_voice_bot")
5. Copy the bot token you receive

## Step 4: Set Up N8N Workflow

1. Import the workflow from `n8n-voice-workflow.json`
2. Configure the following nodes:

### Telegram Trigger Node
- Set your bot token
- Enable webhook mode

### OpenAI Nodes (Speech to Text & Analyze Intent)
- Add your OpenAI API key
- The workflow uses GPT-4 for intent analysis and Whisper for speech recognition

### MCP Node
- Set the server path to your `mcp-server.js` file
- Configure the BizWorx API key as an environment variable

### Environment Variables in N8N
Add these variables to your N8N environment:
```
BIZWORX_API_KEY=your_bizworx_api_key_here
BIZWORX_BASE_URL=http://localhost:5000
OPENAI_API_KEY=your_openai_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

## Step 5: Voice Commands You Can Use

Once set up, you can send voice messages to your Telegram bot with commands like:

### Client Management
- "Create a new client named John Smith with email john@example.com and phone 555-1234"
- "Show me all my clients"

### Job Scheduling
- "Schedule a plumbing job for John Smith tomorrow at 2 PM"
- "Show me all jobs for today"
- "Mark job 123 as completed"

### Invoicing & Estimates
- "Create an invoice for John Smith for $500"
- "Create an estimate for bathroom renovation for $2000"
- "Show me this month's revenue"

### Job Status Updates
- "Update job 456 status to in progress"
- "Set job 789 to completed"

## Step 6: How It Works

1. **Voice Input**: You send a voice message to your Telegram bot
2. **Speech Recognition**: OpenAI Whisper converts speech to text
3. **Intent Analysis**: GPT-4 analyzes the text to understand what you want
4. **MCP Processing**: The MCP server calls your BizWorx API
5. **Response**: You get a formatted response back in Telegram

## Example Voice Command Flow

**You say**: "Schedule a plumbing job for John Smith tomorrow at 2 PM"

**The system**:
1. Converts your voice to text
2. Identifies intent: `create_job`
3. Extracts data: client="John Smith", type="plumbing", date="tomorrow", time="2 PM"
4. Finds John Smith in your client list
5. Creates the job in BizWorx
6. Responds: "✅ Job scheduled successfully! Title: Plumbing Job, Client: John Smith, Scheduled: Dec 9, 2024 2:00 PM, Job ID: 123"

## Testing the Setup

1. Start your BizWorx app (`npm run dev`)
2. Start the N8N workflow
3. Send a voice message to your Telegram bot
4. Check that the bot responds appropriately

## Troubleshooting

### MCP Server Issues
- Ensure Node.js is installed and `@modelcontextprotocol/sdk` package is available
- Check that your BizWorx API key is valid
- Verify the base URL is correct (http://localhost:5000 for local development)

### N8N Issues
- Confirm all environment variables are set
- Check that the MCP node can find the server file
- Verify webhook URLs are properly configured

### Telegram Issues
- Ensure bot token is correct
- Check that webhook is properly set up
- Verify bot has permission to receive voice messages

## Security Notes

- Keep your API keys secure and never share them
- Use environment variables for all sensitive data
- Consider using HTTPS for production deployments
- Regularly rotate your API keys

## Next Steps

Once working, you can:
- Add more complex voice commands
- Integrate with other business tools
- Set up automated scheduling
- Add voice responses using text-to-speech
- Create custom business workflows

This setup gives you a single MCP node that handles all BizWorx operations through voice commands via Telegram.