import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure passport
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

// Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Basic routes for rollback testing
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ 
    status: "BizWorx Server Running", 
    version: "1.0.0",
    timestamp: new Date().toISOString() 
  });
});

// Authentication routes
app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ success: false, error: "Logout failed" });
    res.json({ success: true });
  });
});

app.get("/auth/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, error: "Not authenticated" });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error("Error:", err);
});

(async () => {
  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // Setup vite
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();