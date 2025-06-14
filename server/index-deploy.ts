import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { registerGPTRoutes } from "./gpt-routes-final";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS configuration for GPT access
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

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "bizworx-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Passport authentication configuration
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'pin' },
  async (email: string, pin: string, done) => {
    try {
      const user = await storage.getUserByEmailAndPin(email, pin);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or PIN' });
      }
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Deployment health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

(async () => {
  try {
    // Register GPT routes for ChatGPT integration
    console.log('Registering GPT routes for ChatGPT integration');
    registerGPTRoutes(app);

    // Register standard application routes
    console.log('Registering standard application routes');
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      if (status >= 500) {
        console.error("Server Error:", err);
      }
    });

    // In production, serve static files; in development, use Vite
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    const port = Number(process.env.PORT) || 5000;
    server.listen(port, "0.0.0.0", () => {
      console.log(`BizWorx server running on port ${port} (${process.env.NODE_ENV || 'development'})`);
      console.log('ChatGPT integration: ACTIVE');
      console.log('Rollback support: READY');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();