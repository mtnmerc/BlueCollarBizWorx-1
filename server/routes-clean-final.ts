import type { Express } from "express";
import { registerGPTRoutes } from "./gpt-routes-final";
import { registerRoutes } from "./routes";

export async function registerCleanRoutes(app: Express) {
  console.log('=== CLEAN ROUTES: Registering GPT routes FIRST ===');
  
  // Register ONLY the schema-compliant GPT routes
  registerGPTRoutes(app);
  
  console.log('=== CLEAN ROUTES: GPT routes registered successfully ===');
  
  // Skip all other route registration to test GPT isolation
  return app;
}