import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const port = parseInt(process.env.PORT || "5000", 10);

// Basic middleware
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

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bizworx-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const { storage } = await import("./storage");
        const user = await storage.authenticateUser(email, password);
        return done(null, user);
      } catch (error: any) {
        return done(null, false, { message: error.message });
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const { getUserById } = await import("./storage");
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Register all routes
registerRoutes(app);

// Setup Vite in development or serve static files in production
if (process.env.NODE_ENV !== "production") {
  await setupVite(app);
} else {
  serveStatic(app);
}

const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  log(`Server running on port ${port}`);
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log(`Server ready at http://0.0.0.0:${port}`);
});