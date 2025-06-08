#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

class BizWorxMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'bizworx-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.baseUrl = process.env.BIZWORX_BASE_URL || 'http://localhost:5000';
    this.setupToolHandlers();
  }

  async makeApiRequest(endpoint, options = {}) {
    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new McpError(ErrorCode.InvalidRequest, 'API key is required');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new McpError(
        ErrorCode.InternalError,
        `API request failed: ${response.status} ${errorText}`
      );
    }

    return response.json();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_clients',
          description: 'Get list of all clients for the business',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: {
                type: 'string',
                description: 'Business API key for authentication',
              },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'create_client',
          description: 'Create a new client',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              name: { type: 'string', description: 'Client name' },
              email: { type: 'string', description: 'Client email' },
              phone: { type: 'string', description: 'Client phone number' },
              address: { type: 'string', description: 'Client address' },
            },
            required: ['apiKey', 'name', 'email'],
          },
        },
        {
          name: 'get_invoices',
          description: 'Get list of all invoices',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'create_invoice',
          description: 'Create a new invoice',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              clientId: { type: 'number', description: 'Client ID' },
              title: { type: 'string', description: 'Invoice title' },
              description: { type: 'string', description: 'Invoice description' },
              lineItems: {
                type: 'array',
                description: 'Array of line items',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    quantity: { type: 'number' },
                    rate: { type: 'string' },
                    amount: { type: 'string' },
                  },
                },
              },
              total: { type: 'string', description: 'Total amount' },
            },
            required: ['apiKey', 'clientId', 'title', 'lineItems', 'total'],
          },
        },
        {
          name: 'get_estimates',
          description: 'Get list of all estimates',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'create_estimate',
          description: 'Create a new estimate',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              clientId: { type: 'number', description: 'Client ID' },
              title: { type: 'string', description: 'Estimate title' },
              description: { type: 'string', description: 'Estimate description' },
              lineItems: {
                type: 'array',
                description: 'Array of line items',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    quantity: { type: 'number' },
                    rate: { type: 'string' },
                    amount: { type: 'string' },
                  },
                },
              },
              total: { type: 'string', description: 'Total amount' },
              validUntil: { type: 'string', description: 'Valid until date (ISO format)' },
            },
            required: ['apiKey', 'clientId', 'title', 'lineItems', 'total'],
          },
        },
        {
          name: 'get_jobs',
          description: 'Get jobs for a specific date or all jobs',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              date: { type: 'string', description: 'Date filter (YYYY-MM-DD format)' },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'create_job',
          description: 'Create a new job',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              clientId: { type: 'number', description: 'Client ID' },
              title: { type: 'string', description: 'Job title' },
              description: { type: 'string', description: 'Job description' },
              address: { type: 'string', description: 'Job address' },
              scheduledStart: { type: 'string', description: 'Scheduled start time (ISO format)' },
              scheduledEnd: { type: 'string', description: 'Scheduled end time (ISO format)' },
            },
            required: ['apiKey', 'clientId', 'title', 'scheduledStart'],
          },
        },
        {
          name: 'update_job_status',
          description: 'Update job status',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              jobId: { type: 'number', description: 'Job ID' },
              status: { 
                type: 'string', 
                description: 'New status',
                enum: ['scheduled', 'in_progress', 'completed', 'cancelled']
              },
            },
            required: ['apiKey', 'jobId', 'status'],
          },
        },
        {
          name: 'get_revenue_stats',
          description: 'Get revenue statistics for a specific month',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
              month: { type: 'number', description: 'Month (1-12)' },
              year: { type: 'number', description: 'Year' },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'get_services',
          description: 'Get list of all services',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Business API key' },
            },
            required: ['apiKey'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_clients':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/clients', {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          case 'create_client':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/clients', {
                      method: 'POST',
                      apiKey: args.apiKey,
                      body: JSON.stringify({
                        name: args.name,
                        email: args.email,
                        phone: args.phone,
                        address: args.address,
                      }),
                    })
                  ),
                },
              ],
            };

          case 'get_invoices':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/invoices', {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          case 'create_invoice':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/invoices', {
                      method: 'POST',
                      apiKey: args.apiKey,
                      body: JSON.stringify({
                        clientId: args.clientId,
                        title: args.title,
                        description: args.description,
                        lineItems: args.lineItems,
                        subtotal: args.total,
                        total: args.total,
                      }),
                    })
                  ),
                },
              ],
            };

          case 'get_estimates':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/estimates', {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          case 'create_estimate':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/estimates', {
                      method: 'POST',
                      apiKey: args.apiKey,
                      body: JSON.stringify({
                        clientId: args.clientId,
                        title: args.title,
                        description: args.description,
                        lineItems: args.lineItems,
                        subtotal: args.total,
                        total: args.total,
                        validUntil: args.validUntil,
                      }),
                    })
                  ),
                },
              ],
            };

          case 'get_jobs':
            let jobsEndpoint = '/api/external/jobs';
            if (args.date) {
              // Use the date-specific endpoint if date is provided
              jobsEndpoint = `/api/external/jobs/date/${args.date}`;
            }
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest(jobsEndpoint, {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          case 'create_job':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/jobs', {
                      method: 'POST',
                      apiKey: args.apiKey,
                      body: JSON.stringify({
                        clientId: args.clientId,
                        title: args.title,
                        description: args.description,
                        address: args.address,
                        scheduledStart: args.scheduledStart,
                        scheduledEnd: args.scheduledEnd,
                      }),
                    })
                  ),
                },
              ],
            };

          case 'update_job_status':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest(`/api/external/jobs/${args.jobId}`, {
                      method: 'PATCH',
                      apiKey: args.apiKey,
                      body: JSON.stringify({
                        status: args.status,
                      }),
                    })
                  ),
                },
              ],
            };

          case 'get_revenue_stats':
            const now = new Date();
            const month = args.month || now.getMonth() + 1;
            const year = args.year || now.getFullYear();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest(`/api/external/revenue?month=${month}&year=${year}`, {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          case 'get_services':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    await this.makeApiRequest('/api/external/services', {
                      apiKey: args.apiKey,
                    })
                  ),
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BizWorx MCP server running on stdio');
  }
}

const server = new BizWorxMCPServer();
server.run().catch(console.error);