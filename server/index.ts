import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initDatabase } from "./db";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

// API Request Logging Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`🌐 ${req.method} ${req.path}`);
    console.log(`📍 Headers:`, JSON.stringify({
      authorization: req.headers.authorization ? `Bearer ${req.headers.authorization.slice(-10)}...` : 'None',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.slice(0, 50) + '...'
    }, null, 2));
    
    if (req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
      console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
    }
    
    if (Object.keys(req.query || {}).length > 0) {
      console.log(`🔗 Query:`, JSON.stringify(req.query, null, 2));
    }
  }
  next();
});

// Add cache control headers for API requests only (not affecting user sessions)
app.use((req, res, next) => {
  // Only apply cache control to API requests to prevent caching API responses
  if (req.path.startsWith('/api/')) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database
  await initDatabase();
  
  const server = await registerRoutes(app);

  // Enhanced error handling middleware with comprehensive logging
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log detailed error information
    console.error(`🚨 API Error: ${req.method} ${req.path}`);
    console.error(`📍 Status: ${status}`);
    console.error(`💬 Message: ${message}`);
    console.error(`🔍 Stack:`, err.stack);
    console.error(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
    console.error(`🔗 Request Headers:`, JSON.stringify(req.headers, null, 2));
    console.error(`⏰ Timestamp:`, new Date().toISOString());
    console.error('━'.repeat(60));

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details || null
      })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
