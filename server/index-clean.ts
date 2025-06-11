import express, { type Request, Response, NextFunction } from "express";
import { registerGPTRoutes } from "./gpt-routes-final";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Register GPT routes FIRST with highest priority
console.log('CLEAN SERVER: Registering GPT routes with highest priority');
registerGPTRoutes(app);

// Register all other routes after GPT routes
console.log('CLEAN SERVER: Registering standard routes');
const server = await registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
});

// Setup Vite development server
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

console.log('CLEAN SERVER: All routes registered successfully');