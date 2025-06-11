import express from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { registerGPTRoutes } from "./gpt-routes-final";
import { storage } from "./storage";
import { setupVite } from "./vite";

const app = express();
const port = 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: "bizworx-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Minimal passport configuration (not needed for GPT testing)
passport.use(
  new LocalStrategy(async (username, password, done) => {
    return done(null, false);
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  done(null, null);
});

console.log('=== CLEAN GPT SERVER: Registering ONLY schema-compliant GPT routes ===');

// Register ONLY the schema-compliant GPT routes - no duplicates
registerGPTRoutes(app);

console.log('=== CLEAN GPT SERVER: GPT routes registered successfully ===');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Clean GPT server running - no duplicate handlers'
  });
});

// Setup Vite in development
if (process.env.NODE_ENV !== "production") {
  await setupVite(app);
}

const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`Clean GPT server running on port ${port}`);
  console.log('Only schema-compliant GPT routes are active');
});