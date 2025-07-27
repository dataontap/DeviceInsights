import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Set environment variables for client - ensure it's available before Vite starts
if (process.env.GOOGLE_MAPS_API_KEY) {
  process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  console.log('Google Maps API key set for client:', process.env.GOOGLE_MAPS_API_KEY ? 'YES' : 'NO');
} else {
  console.error('GOOGLE_MAPS_API_KEY environment variable is not set');
}

// Configure trust proxy for rate limiting to work correctly
app.set('trust proxy', 1);

// SECURITY: Request size limits to prevent DoS attacks
app.use(express.json({ limit: '10mb' })); // Limit JSON payloads to 10MB
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // Limit URL-encoded payloads

// SECURITY: Add security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Remove server signature
  res.removeHeader('X-Powered-By');
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

      // SECURITY: Only log non-sensitive response data for successful requests
      if (capturedJsonResponse && res.statusCode < 400) {
        // Log only safe fields, exclude sensitive data like API keys
        const safeResponse: any = {};
        if (capturedJsonResponse.success !== undefined) safeResponse.success = capturedJsonResponse.success;
        if (capturedJsonResponse.device) safeResponse.device = capturedJsonResponse.device;
        if (capturedJsonResponse.searchId) safeResponse.searchId = capturedJsonResponse.searchId;
        if (capturedJsonResponse.totalSearches !== undefined) safeResponse.totalSearches = capturedJsonResponse.totalSearches;

        if (Object.keys(safeResponse).length > 0) {
          logLine += ` :: ${JSON.stringify(safeResponse)}`;
        }
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
  const server = await registerRoutes(app);

  // SECURITY: Improved error handling - don't leak internal details
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Log detailed error for debugging (server-side only)
    console.error(`Error ${status} on ${req.method} ${req.path}:`, {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Send sanitized error response to client
    const response: any = {
      error: status >= 500 ? "Internal Server Error" : err.message || "Request failed",
      status: status
    };

    // Only include error details for client errors (400-499), not server errors
    if (status < 500 && err.details) {
      response.details = err.details;
    }

    res.status(status).json(response);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();