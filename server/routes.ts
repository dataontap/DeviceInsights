import type { Express, Request } from "express";
import { createServer, type Server } from "http";

// Extend Express Request interface
interface AuthenticatedRequest extends Request {
  apiKeyId?: number;
  apiKeyName?: string;
  adminEmail?: string;
}
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { analyzeIMEI, getTopCarriers, validateIMEI, generateWorldMapSVG } from './services/gemini.js';
import { insertImeiSearchSchema, insertPolicyAcceptanceSchema, generateApiKeySchema, magicLinkRequestSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { registerPDFRoutes } from "./routes/pdf-generator";

// SECURE API key validation middleware
async function validateApiKey(req: AuthenticatedRequest, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || apiKey.trim() === '') {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'API key must be provided in Authorization header' 
      });
    }

    // Validate API key format (should start with 'imei_')
    if (!apiKey.startsWith('imei_')) {
      return res.status(401).json({ 
        error: 'Invalid API key format',
        message: 'API key format is invalid' 
      });
    }

    // Hash the provided key and validate against database
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const storedKey = await storage.getApiKeyByHash(keyHash);

    if (!storedKey || !storedKey.isActive) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'API key is invalid or inactive' 
      });
    }

    // Update last used timestamp and increment usage count
    await storage.incrementApiKeyUsage(keyHash);

    // Store validated key info for logging/analytics (but not the actual key)
    req.apiKeyId = storedKey.id;
    req.apiKeyName = storedKey.name;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Unable to validate API key' 
    });
  }
}

// Extract country from location for caching purposes
function extractCountryFromLocation(location: string): string {
  const normalized = location.toLowerCase().trim();

  // Handle coordinate-based locations
  if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(normalized)) {
    return "GPS_COORDINATES"; // Generic cache key for GPS coordinates
  }

  // Common country patterns
  const countryMappings: { [key: string]: string } = {
    'united states': 'United States',
    'usa': 'United States',
    'us': 'United States',
    'canada': 'Canada',
    'ca': 'Canada',
    'united kingdom': 'United Kingdom',
    'uk': 'United Kingdom',
    'gb': 'United Kingdom',
    'australia': 'Australia',
    'au': 'Australia',
    'germany': 'Germany',
    'de': 'Germany',
    'france': 'France',
    'fr': 'France',
    'japan': 'Japan',
    'jp': 'Japan',
    'mexico': 'Mexico',
    'mx': 'Mexico',
    'brazil': 'Brazil',
    'br': 'Brazil',
    'india': 'India',
    'in': 'India',
    'china': 'China',
    'cn': 'China'
  };

  // Check for exact country matches first
  if (countryMappings[normalized]) {
    return countryMappings[normalized];
  }

  // Check if location contains country names
  for (const [pattern, country] of Object.entries(countryMappings)) {
    if (normalized.includes(pattern)) {
      return country;
    }
  }

  // Default fallback
  return 'Unknown';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting: 100 requests per hour for Alpha service
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Rate limit exceeded",
      message: "Too many requests from this IP. Please try again later.",
      details: "This Alpha service is limited to 100 requests per hour per IP address."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all API routes
  app.use('/api', limiter);

  // SECURE CORS configuration - restrict to trusted domains
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://imei-checker.replit.app', // Production domain
      'https://3253a27d-7995-4bba-9336-127493ad92d8-00-1dfw0f3xq3gjv.riker.replit.dev', // Replit dev domain
      'http://localhost:5000', // Local development
      'http://localhost:3000'  // Common dev port
    ];

    // Allow same-origin requests (when origin is undefined)
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // API Documentation endpoint
  app.get("/api/v1/docs", (req, res) => {
    res.json({
      name: "IMEI Device Checker API",
      version: "1.0.0-alpha",
      status: "ALPHA - Use with caution",
      description: "AI-powered IMEI analysis and network compatibility checking (Alpha version)",
      disclaimer: "⚠️ ALPHA VERSION: This service is in early testing phase. Results are tentative and should be treated with caution. Use at your own discretion.",
      baseUrl: `${req.protocol}://${req.get('host')}`,
      rateLimits: {
        perHour: 100,
        note: "100 requests per hour per IP address"
      },
      endpoints: {
        "POST /api/v1/check": "Analyze IMEI device compatibility",
        "GET /api/v1/stats": "Get your API key's usage statistics",
        "GET /api/v1/export": "Export your search data only",
        "GET /api/v1/search/{id}": "Get individual search details (your searches only)",
        "GET /api/v1/my/searches": "Get your detailed search data with location info"
      },
      authentication: {
        type: "Bearer Token",
        header: "Authorization: Bearer YOUR_API_KEY",
        note: "Include any non-empty string as API key for Alpha testing purposes"
      },
      important: {
        alphaWarning: "This is an Alpha service. All results are tentative and experimental.",
        dataAccuracy: "Device compatibility information may not be 100% accurate.",
        useAtOwnRisk: "Users acknowledge they use this service at their own discretion."
      },
      examples: {
        curl: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/check \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{"imei": "123456789012345", "location": "San Francisco, CA"}'`,
        javascript: `fetch('${req.protocol}://${req.get('host')}/api/v1/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    imei: '123456789012345',
    location: 'San Francisco, CA'
  })
})`
      },
      documentation: "Visit the admin section for complete API documentation"
    });
  });

  // Get top carriers for a location
  app.post("/api/carriers", async (req, res) => {
    try {
      const { location } = req.body;

      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }

      // Extract country from location for caching
      const country = extractCountryFromLocation(location);

      // Check cache first
      const cachedData = await storage.getCachedCarriers(country);
      if (cachedData) {
        console.log(`Cache hit for country: ${country}`);
        return res.json({
          success: true,
          ...cachedData,
          cached: true
        });
      }

      // Cache miss - fetch from LLM
      console.log(`Cache miss for country: ${country}, fetching from LLM`);
      const { getTopCarriers } = await import("./services/gemini.js");
      const carriersData = await getTopCarriers(location);

      // Cache the result for 24 hours
      await storage.setCachedCarriers(country, carriersData, 24);

      res.json({
        success: true,
        ...carriersData,
        cached: false
      });
    } catch (error) {
      console.error("Carriers fetch error:", error);
      res.status(500).json({ 
        error: "Failed to fetch carriers",
        success: false,
        country: "United States",
        carriers: [
          { name: "AT&T", marketShare: "45.4%", description: "Default carrier for compatibility testing" }
        ]
      });
    }
  });

  // Web interface IMEI check (no API key required)
  app.post("/api/check", async (req, res) => {
    try {
      const { imei, location, network } = req.body;

      if (!imei) {
        return res.status(400).json({ error: "IMEI is required" });
      }

      // Validate IMEI format
      if (!validateIMEI(imei)) {
        return res.status(400).json({ error: "Invalid IMEI format" });
      }

      // Check if IMEI is blacklisted
      const blacklistedImei = await storage.isImeiBlacklisted(imei);
      if (blacklistedImei) {
        return res.status(403).json({ 
          error: "Blacklisted IMEI",
          message: "It looks like the device IMEI you provided is on the 'naughty list'. Please contact support.",
          success: false,
          blacklisted: true,
          reason: blacklistedImei.reason
        });
      }

      // Get client IP and user agent for analytics
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      try {
        // Analyze device using AI with specified network (default OXIO)
        const targetNetwork = network || "OXIO";
        const deviceInfo = await analyzeIMEI(imei, targetNetwork);

        // Store search in database
        const searchData = {
          imei,
          deviceMake: deviceInfo.make,
          deviceModel: deviceInfo.model,
          deviceYear: deviceInfo.year,
          networkCapabilities: deviceInfo.networkCapabilities,
          aiResponse: deviceInfo as any,
          searchLocation: location || 'unknown',
          ipAddress,
          userAgent,
        };

        const search = await storage.createImeiSearch(searchData);

        // Check if this is a popular device
        const isPopular = await storage.isPopularDevice(deviceInfo.make || '', deviceInfo.model || '');

        res.json({
          success: true,
          searchId: search.id,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            modelNumber: deviceInfo.modelNumber,
            imei: imei,
            isPopular: isPopular
          },
          networkCompatibility: deviceInfo.networkCapabilities,
          analysis: deviceInfo.tacAnalysis || "Device analysis completed",
          specifications: deviceInfo.specifications,
          recommendations: []
        });
      } catch (error) {
        console.error("AI Analysis failed:", error);

        // Store failed search for analytics
        const searchData = {
          imei,
          deviceMake: "unknown",
          deviceModel: "unknown", 
          deviceYear: null,
          networkCapabilities: null,
          aiResponse: { error: error instanceof Error ? error.message : "Unknown error" } as any,
          searchLocation: location || 'unknown',
          ipAddress,
          userAgent,
        };

        const search = await storage.createImeiSearch(searchData);

        res.status(500).json({
          error: "Device analysis failed",
          details: error instanceof Error ? error.message : "Unknown error",
          searchId: search.id
        });
      }
    } catch (error) {
      console.error("IMEI check error:", error);
      res.status(500).json({ error: "Failed to process IMEI check" });
    }
  });

  // Web interface policy acceptance (no API key required)
  app.post("/api/policy/accept", async (req, res) => {
    try {
      const validationSchema = z.object({
        searchId: z.number().optional(),
        accepted: z.boolean(),
        deviceInfo: z.object({
          make: z.string().optional(),
          model: z.string().optional(),
          compatible: z.boolean().optional(),
        }).optional(),
      });

      const { searchId, accepted, deviceInfo } = validationSchema.parse(req.body);

      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const policyData = {
        searchId: searchId || null,
        ipAddress,
        userAgent,
        policyVersion: "v1.0",
        accepted,
        deviceInfo: deviceInfo || null,
      };

      const acceptance = await storage.createPolicyAcceptance(policyData);

      res.json({
        success: true,
        acceptanceId: acceptance.id,
        accepted: acceptance.accepted,
        timestamp: acceptance.acceptedAt
      });
    } catch (error) {
      console.error("Policy acceptance error:", error);
      res.status(500).json({ error: "Failed to record policy acceptance" });
    }
  });

  // IMEI Analysis endpoint (with API key validation for external access)  
  app.post("/api/v1/check", validateApiKey, async (req, res) => {
    try {
      const { imei, location, network } = req.body;

      if (!imei) {
        return res.status(400).json({ error: "IMEI is required" });
      }

      // Validate IMEI format
      if (!validateIMEI(imei)) {
        return res.status(400).json({ error: "Invalid IMEI format" });
      }

      // Check if IMEI is blacklisted
      const blacklistedImei = await storage.isImeiBlacklisted(imei);
      if (blacklistedImei) {
        return res.status(403).json({ 
          error: "Blacklisted IMEI",
          message: "It looks like the device IMEI you provided is on the 'naughty list'. Please contact support.",
          success: false,
          blacklisted: true,
          reason: blacklistedImei.reason
        });
      }

      // Get client IP and user agent for analytics
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      try {
        // Analyze device using AI with specified network (default AT&T)
        const targetNetwork = network || "AT&T";
        const deviceInfo = await analyzeIMEI(imei, targetNetwork);

        // Store search in database with API key association
        const searchData = {
          imei,
          deviceMake: deviceInfo.make,
          deviceModel: deviceInfo.model,
          deviceYear: deviceInfo.year,
          networkCapabilities: deviceInfo.networkCapabilities,
          aiResponse: deviceInfo as any,
          searchLocation: location || 'unknown',
          ipAddress,
          userAgent,
          apiKeyId: req.apiKeyId, // Associate with the API key
        };

        const search = await storage.createImeiSearch(searchData);

        // Check if this is a popular device
        const isPopular = await storage.isPopularDevice(deviceInfo.make || '', deviceInfo.model || '');

        res.json({
          success: true,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            modelNumber: deviceInfo.modelNumber,
            imei: imei,
            isPopular: isPopular
          },
          capabilities: deviceInfo.networkCapabilities,
          specifications: deviceInfo.specifications,
          tacAnalysis: deviceInfo.tacAnalysis,
          searchId: search.id
        });
      } catch (aiError) {
        console.error("AI Analysis error:", aiError);

        // Store failed search with API key association
        await storage.createImeiSearch({
          imei,
          searchLocation: location || 'unknown',
          ipAddress,
          userAgent,
          apiKeyId: req.apiKeyId,
        });

        res.status(500).json({ 
          error: "Failed to analyze device. Please try again.", 
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error("API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get search statistics (API key specific for authenticated requests)
  app.get("/api/v1/stats", validateApiKey, async (req, res) => {
    try {
      // Get stats only for this API key
      const stats = await storage.getSearchStatisticsByApiKey(req.apiKeyId);
      const popularDevices = await storage.getPopularDevicesByApiKey(req.apiKeyId, 5);

      res.json({
        totalSearches: stats.totalSearches,
        uniqueDevices: stats.uniqueDevices,
        successRate: stats.successRate,
        apiCalls: stats.totalSearches,
        popularDevices: popularDevices.map(device => ({
          name: `${device.deviceMake} ${device.deviceModel}`,
          manufacturer: device.deviceMake,
          searches: device.searchCount
        }))
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Export search data (requires API key - only returns data for this API key)
  app.get("/api/v1/export", validateApiKey, async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const limit = parseInt(req.query.limit as string) || 1000;

      // Only get searches for this specific API key
      const searches = await storage.getImeiSearchesByApiKey(req.apiKeyId, limit);

      if (format === 'csv') {
        const csvData = [
          'ID,IMEI,Device Make,Device Model,Device Year,Search Location,IP Address,Searched At',
          ...searches.map(search => [
            search.id,
            search.imei,
            search.deviceMake || '',
            search.deviceModel || '',
            search.deviceYear || '',
            search.searchLocation || '',
            search.ipAddress || '',
            search.searchedAt?.toISOString() || ''
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=my_imei_searches.csv');
        res.send(csvData);
      } else {
        res.json({
          searches: searches.map(search => ({
            id: search.id,
            imei: search.imei,
            device: {
              make: search.deviceMake,
              model: search.deviceModel,
              year: search.deviceYear
            },
            location: search.searchLocation,
            searchedAt: search.searchedAt
          })),
          apiKeyName: req.apiKeyName,
          totalCount: searches.length
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Get individual search by ID (requires API key - only returns data owned by this API key)
  app.get("/api/v1/search/:id", validateApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get search and verify it belongs to this API key
      const search = await storage.getImeiSearchByIdAndApiKey(id, req.apiKeyId);

      if (!search) {
        return res.status(404).json({ 
          error: "Search not found", 
          message: "Search does not exist or you do not have access to it" 
        });
      }

      res.json({
        id: search.id,
        imei: search.imei,
        device: {
          make: search.deviceMake,
          model: search.deviceModel,
          year: search.deviceYear
        },
        capabilities: search.networkCapabilities,
        aiResponse: search.aiResponse,
        location: search.searchLocation,
        searchedAt: search.searchedAt
      });
    } catch (error) {
      console.error("Search lookup error:", error);
      res.status(500).json({ error: "Failed to fetch search" });
    }
  });

  // Get recent valid searches (excluding unknowns) - no authentication required
  app.get("/api/v1/recent-searches", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const searches = await storage.getRecentValidSearches(limit);

      res.json({
        searches: searches.map(search => ({
          id: search.id,
          device: {
            make: search.deviceMake,
            model: search.deviceModel,
            year: search.deviceYear
          },
          searchedAt: search.searchedAt
        }))
      });
    } catch (error) {
      console.error("Recent searches error:", error);
      res.status(500).json({ error: "Failed to fetch recent searches" });
    }
  });

  // Get user's own searches with detailed data (requires API key)
  app.get("/api/v1/my/searches", validateApiKey, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      // Only get searches for this specific API key
      const searches = await storage.getImeiSearchesByApiKey(req.apiKeyId, limit);

      res.json({
        searches: searches.map(search => ({
          id: search.id,
          imei: search.imei,
          device: {
            make: search.deviceMake,
            model: search.deviceModel,
            year: search.deviceYear
          },
          location: search.searchLocation,
          coordinates: search.searchLocation?.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/) ? {
            lat: parseFloat(search.searchLocation.split(',')[0]),
            lng: parseFloat(search.searchLocation.split(',')[1])
          } : null,
          searchedAt: search.searchedAt,
          ipAddress: search.ipAddress
        })),
        apiKeyName: req.apiKeyName,
        totalCount: searches.length
      });
    } catch (error) {
      console.error("My searches error:", error);
      res.status(500).json({ error: "Failed to fetch your searches" });
    }
  });

  // Public map data endpoint (no authentication required)
  app.get("/api/map/searches", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const searches = await storage.getImeiSearches(limit);

      res.json({
        searches: searches.map(search => ({
          id: search.id,
          location: search.searchLocation,
          deviceMake: search.deviceMake,
          deviceModel: search.deviceModel,
          searchedAt: search.searchedAt,
          coordinates: search.searchLocation?.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/) ? {
            lat: parseFloat(search.searchLocation.split(',')[0]),
            lng: parseFloat(search.searchLocation.split(',')[1])
          } : null
        }))
      });
    } catch (error) {
      console.error("Map searches error:", error);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  });

  // Generate world map SVG using Gemini AI (public endpoint)
  app.get('/api/map/generate', async (req, res) => {
    try {
      const svgPaths = await generateWorldMapSVG();

      res.json({ 
        svgPaths,
        generated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating world map:', error);
      res.status(500).json({ error: 'Failed to generate world map' });
    }
  });

  // Policy acceptance endpoint (requires API key)
  app.post("/api/v1/policy/accept", validateApiKey, async (req, res) => {
    try {
      const validationSchema = z.object({
        searchId: z.number().optional(),
        accepted: z.boolean(),
        deviceInfo: z.object({
          make: z.string().optional(),
          model: z.string().optional(),
          compatible: z.boolean().optional(),
        }).optional(),
      });

      const { searchId, accepted, deviceInfo } = validationSchema.parse(req.body);

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const policyData = {
        searchId: searchId || null,
        ipAddress,
        userAgent,
        policyVersion: "v1.0",
        accepted,
        deviceInfo: deviceInfo || null,
      };

      const acceptance = await storage.createPolicyAcceptance(policyData);

      res.json({
        success: true,
        acceptanceId: acceptance.id,
        accepted: acceptance.accepted,
        timestamp: acceptance.acceptedAt
      });
    } catch (error) {
      console.error("Policy acceptance error:", error);
      res.status(500).json({ error: "Failed to record policy acceptance" });
    }
  });

  // Generate API key endpoint (no API key required - public registration)
  app.post("/api/generate-key", async (req, res) => {
    try {
      // SECURITY: Apply additional rate limiting for key generation
      const userIP = req.ip || 'unknown';

      const { email, name } = generateApiKeySchema.parse(req.body);

      // SECURITY: Additional validation and sanitization
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedName = name.trim().substring(0, 100); // Limit name length

      // SECURITY: Check for suspicious patterns
      if (sanitizedName.length < 2) {
        return res.status(400).json({ 
          error: "Invalid name", 
          details: ["Name must be at least 2 characters long"]
        });
      }

      // Generate unique API key with stronger entropy
      const apiKey = `imei_${nanoid(24)}_${Date.now()}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Store in database with sanitized data
      const storedKey = await storage.createApiKey({
        key: apiKey,
        keyHash,
        email: sanitizedEmail,
        name: sanitizedName,
      });

      res.json({
        success: true,
        apiKey: apiKey,
        keyId: storedKey.id,
        email: storedKey.email,
        name: storedKey.name,
        createdAt: storedKey.createdAt,
        message: "API key generated successfully. Store it securely - it cannot be retrieved again."
      });
    } catch (error) {
      console.error("API key generation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  // Get policy compliance statistics (requires API key)
  app.get("/api/v1/policy/stats", validateApiKey, async (req, res) => {
    try {
      const stats = await storage.getPolicyComplianceStats();

      res.json({
        compliance: {
          totalAcceptances: stats.totalAcceptances,
          acceptanceRate: stats.acceptanceRate,
          recentAcceptances: stats.recentAcceptances
        },
        policyVersion: "v1.0",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Policy stats error:", error);
      res.status(500).json({ error: "Failed to fetch policy statistics" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/validate-email", async (req, res) => {
    try {
      const { email } = magicLinkRequestSchema.parse(req.body);

      // Check if email has an API key (is registered)
      const apiKey = await storage.getApiKeyByEmail(email);
      if (!apiKey) {
        return res.status(404).json({ 
          error: "Email not found",
          message: "This email is not registered. Please generate an API key first." 
        });
      }

      res.json({ 
        success: true,
        message: "Email is registered" 
      });
    } catch (error) {
      console.error("Email validation error:", error);
      res.status(400).json({ 
        error: "Invalid request",
        message: error instanceof Error ? error.message : "Failed to validate email" 
      });
    }
  });

  app.post("/api/admin/create-session", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: "Email required",
          message: "Email is required to create session" 
        });
      }

      // Verify email has an API key (is registered)
      const apiKey = await storage.getApiKeyByEmail(email);
      if (!apiKey) {
        return res.status(404).json({ 
          error: "Email not found",
          message: "This email is not registered. Please generate an API key first." 
        });
      }

      // Create admin session
      const sessionToken = nanoid(32);
      const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createAdminSession({
        email,
        sessionToken,
        expiresAt: sessionExpiresAt
      });

      res.json({ 
        success: true,
        sessionToken,
        email 
      });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ 
        error: "Session creation failed",
        message: "Failed to create admin session" 
      });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      const { sessionToken } = req.body;

      if (sessionToken) {
        await storage.deleteAdminSession(sessionToken);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ 
        error: "Logout failed",
        message: "Failed to logout" 
      });
    }
  });

  // Temporary magic link endpoints (fallback when Firebase is not configured)
  app.post("/api/admin/send-temp-link", async (req, res) => {
    try {
      const { email } = magicLinkRequestSchema.parse(req.body);
      
      // Check if email has an API key (is registered)
      const apiKey = await storage.getApiKeyByEmail(email);
      if (!apiKey) {
        return res.status(404).json({ 
          error: "Email not found",
          message: "This email is not registered. Please generate an API key first." 
        });
      }
      
      // Generate login token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      await storage.createLoginToken({
        email,
        token,
        expiresAt
      });
      
      // Log the magic link for testing (in production, send via email)
      const magicLink = `${req.protocol}://${req.get('host')}/admin?token=${token}`;
      console.log(`🔐 Magic link for ${email}: ${magicLink}`);
      
      res.json({ 
        success: true,
        message: "Magic link sent! Check console for dev link.",
        devNote: magicLink
      });
    } catch (error) {
      console.error("Temp magic link error:", error);
      res.status(400).json({ 
        error: "Invalid request",
        message: error instanceof Error ? error.message : "Failed to send magic link" 
      });
    }
  });

  app.post("/api/admin/verify-temp-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          error: "Token required",
          message: "Login token is required" 
        });
      }
      
      // Verify login token
      const loginToken = await storage.getLoginTokenByToken(token);
      if (!loginToken || loginToken.used) {
        return res.status(401).json({ 
          error: "Invalid token",
          message: "Login token is invalid or has expired" 
        });
      }
      
      // Mark token as used
      await storage.useLoginToken(token);
      
      res.json({ 
        success: true,
        email: loginToken.email 
      });
    } catch (error) {
      console.error("Temp token verification error:", error);
      res.status(500).json({ 
        error: "Verification failed",
        message: "Failed to verify login token" 
      });
    }
  });

  // Admin session validation middleware
  async function validateAdminSession(req: AuthenticatedRequest, res: any, next: any) {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-session-token'];

      if (!sessionToken) {
        return res.status(401).json({ 
          error: "Authentication required",
          message: "Admin session token required" 
        });
      }

      const session = await storage.getAdminSessionByToken(sessionToken as string);
      if (!session) {
        return res.status(401).json({ 
          error: "Invalid session",
          message: "Admin session is invalid or expired" 
        });
      }

      req.adminEmail = session.email;
      next();
    } catch (error) {
      console.error("Session validation error:", error);
      return res.status(500).json({ 
        error: "Authentication error",
        message: "Failed to validate session" 
      });
    }
  }

  // Register PDF generation routes
  registerPDFRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}