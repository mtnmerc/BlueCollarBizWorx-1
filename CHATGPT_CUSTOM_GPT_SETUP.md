# ChatGPT Custom GPT Setup for BizWorx

## Overview
BizWorx now provides 4 separate OpenAPI schema files for ChatGPT Custom GPT integration, allowing modular access to different business management functions.

## Schema Files

### 1. Clients Management (`chatgpt-clients-schema.json`)
- **Purpose**: Manage client database (create, read, update, delete clients)
- **Endpoints**: 
  - GET /clients (list all clients)
  - POST /clients (create new client)
  - PUT /clients/{id} (update client)
  - DELETE /clients/{id} (delete client)

### 2. Estimates Management (`chatgpt-estimates-schema.json`)
- **Purpose**: Handle project estimates and quotes
- **Endpoints**:
  - GET /estimates (list all estimates)
  - POST /estimates (create new estimate)
  - GET /estimates/{id} (get specific estimate)
  - PUT /estimates/{id} (update estimate)
  - DELETE /estimates/{id} (delete estimate)
  - POST /estimates/{id}/convert-to-invoice (convert to invoice)

### 3. Invoices Management (`chatgpt-invoices-schema.json`)
- **Purpose**: Manage billing and invoicing
- **Endpoints**:
  - GET /invoices (list all invoices)
  - POST /invoices (create new invoice)
  - GET /invoices/{id} (get specific invoice)
  - PUT /invoices/{id} (update invoice)
  - DELETE /invoices/{id} (delete invoice)
  - GET /invoices/stats (revenue statistics)

### 4. Jobs & Scheduling (`chatgpt-jobs-scheduling-schema.json`)
- **Purpose**: Job scheduling and appointment management
- **Endpoints**:
  - GET /jobs (list jobs with date filtering)
  - POST /jobs (create new job/appointment)
  - GET /jobs/{id} (get specific job)
  - PUT /jobs/{id} (update job)
  - DELETE /jobs/{id} (delete job)
  - POST /jobs/natural-language (create job from natural language)

## Authentication

All schemas use **X-API-Key** authentication:
```
X-API-Key: your_business_api_key
```

**Working API Key for Testing**: `bw_wkad606ephtmbqx7a0f` (Flatline Earthworks, Business ID: 1)

## Server Information

- **Base URL**: `https://bluecollarbizworx.replit.app/api/gpt`
- **Protocol**: HTTPS
- **Response Format**: JSON with consistent structure:
  ```json
  {
    "success": boolean,
    "data": [...],
    "message": "string",
    "businessVerification": {
      "businessName": "string",
      "businessId": integer,
      "dataSource": "string", 
      "timestamp": "ISO datetime"
    }
  }
  ```

## ChatGPT Custom GPT Setup Instructions

### Option 1: Single Function GPT (Recommended for Specific Use Cases)
Choose one schema file based on your primary need:
1. Copy the contents of the desired schema file
2. In ChatGPT Custom GPT builder, paste the schema in the "Actions" section
3. Configure authentication with X-API-Key
4. Test with the provided API key

### Option 2: Multi-Function GPT (Advanced)
For comprehensive business management:
1. You can combine multiple schemas by merging their paths and components
2. Or create separate GPTs for each function and use them as needed

### Authentication Setup in ChatGPT
1. Go to Authentication settings
2. Select "API Key"
3. Set API Key to: `bw_wkad606ephtmbqx7a0f`
4. Auth Type: "Custom"
5. Custom Header Name: `X-API-Key`

## Usage Examples

### Clients Management
- "Show me all my clients"
- "Create a new client named John Smith with email john@example.com"
- "Update client ID 5's phone number to 555-1234"

### Estimates Management  
- "List all pending estimates"
- "Create an estimate for client ID 3 for $1500 lawn maintenance"
- "Convert estimate ID 7 to an invoice"

### Invoices Management
- "Show all unpaid invoices"
- "Get revenue stats for December 2024"
- "Create an invoice for client ID 2 for $850"

### Jobs & Scheduling
- "Show all jobs for today"
- "Schedule a lawn mowing appointment for tomorrow at 2 PM for client ID 1"
- "Create appointment: 'Tree trimming at 123 Main St next Friday 10 AM'"

## Business Verification
All responses include business verification data to ensure data authenticity:
- Business Name: Confirms which business data you're viewing
- Business ID: Unique identifier
- Data Source: Always "live_database" (never mock data)
- Timestamp: When the data was retrieved

## Error Handling
- 401: Invalid or missing API key
- 404: Resource not found
- 500: Server error
All errors return: `{"success": false, "error": "description"}`

## Natural Language Processing
The Jobs & Scheduling schema includes a special endpoint for natural language job creation:
- Endpoint: `POST /jobs/natural-language`
- Purpose: Create appointments from conversational descriptions
- Example: "Schedule carpet cleaning for Mrs. Johnson next Tuesday at 3 PM"

## Data Integrity Features
- All data comes from live PostgreSQL database
- No mock or placeholder data
- Real-time business verification
- Consistent response formatting
- Proper error handling and validation

## Support
- Server Status: https://bluecollarbizworx.replit.app/api/gpt/test
- All endpoints are production-ready and actively maintained
- Data is automatically backed up and secured