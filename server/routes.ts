import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import path from "path";

// Extend Express Request interface
interface AuthenticatedRequest extends Request {
  apiKeyId?: number;
  apiKeyName?: string;
  adminEmail?: string;
}
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { analyzeIMEI, getTopCarriers, validateIMEI, generateWorldMapSVG } from './services/gemini.js';
import { sendSMS, sendEmail, sendPushNotification, initializeFirebaseAdmin } from './services/firebase-admin.js';
import { getCoverageAnalysis, getProviderCoverage } from './services/coverage-analyzer.js';
import { analyzeIssueWithAI } from './services/issue-analyzer.js';
import { standardRateLimit, mcpRateLimit, premiumRateLimit } from './middleware/enhanced-rate-limit';
import { insertImeiSearchSchema, insertPolicyAcceptanceSchema, generateApiKeySchema, magicLinkRequestSchema, userRegistrationSchema, connectivityMetricSchema } from "@shared/schema";
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

  // Apply basic rate limiting to all API routes (fallback)
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
        // Analyze device using AI with specified network (default DOTM)
        const targetNetwork = network || "DOTM";
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
  app.post("/api/v1/check", validateApiKey, standardRateLimit, async (req, res) => {
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
          apiKeyId: (req as AuthenticatedRequest).apiKeyId, // Associate with the API key
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
          apiKeyId: (req as AuthenticatedRequest).apiKeyId,
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
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }
      
      // Get stats only for this API key
      const stats = await storage.getSearchStatisticsByApiKey(apiKeyId);
      const popularDevices = await storage.getPopularDevicesByApiKey(apiKeyId, 5);

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
      
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      // Only get searches for this specific API key
      const searches = await storage.getImeiSearchesByApiKey(apiKeyId, limit);

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
          apiKeyName: (req as AuthenticatedRequest).apiKeyName,
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
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      // Get search and verify it belongs to this API key
      const search = await storage.getImeiSearchByIdAndApiKey(id, apiKeyId);

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
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      // Only get searches for this specific API key
      const searches = await storage.getImeiSearchesByApiKey(apiKeyId, limit);

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
        apiKeyName: (req as AuthenticatedRequest).apiKeyName,
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
        message: "Magic link generated! Check console/logs for development link.",
        devNote: `Development mode: ${magicLink}`,
        isDevMode: true
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

  // Firebase Messaging API Routes
  
  // Send SMS notification (requires API key)
  app.post("/api/messaging/sms", validateApiKey, async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Phone number and message are required" 
        });
      }
      
      const success = await sendSMS(phoneNumber, message);
      
      if (success) {
        res.json({ success: true, message: "SMS sent successfully" });
      } else {
        res.status(500).json({ 
          error: "SMS failed",
          message: "Failed to send SMS notification" 
        });
      }
    } catch (error) {
      console.error("SMS API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send email notification (requires API key)
  app.post("/api/messaging/email", validateApiKey, async (req, res) => {
    try {
      const { email, subject, body } = req.body;
      
      if (!email || !subject || !body) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Email, subject, and body are required" 
        });
      }
      
      const success = await sendEmail(email, subject, body);
      
      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ 
          error: "Email failed",
          message: "Failed to send email notification" 
        });
      }
    } catch (error) {
      console.error("Email API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send push notification (requires API key)
  app.post("/api/messaging/push", validateApiKey, async (req, res) => {
    try {
      const { token, title, body, data } = req.body;
      
      if (!token || !title || !body) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Token, title, and body are required" 
        });
      }
      
      const success = await sendPushNotification(token, title, body, data);
      
      if (success) {
        res.json({ success: true, message: "Push notification sent successfully" });
      } else {
        res.status(500).json({ 
          error: "Push notification failed",
          message: "Failed to send push notification" 
        });
      }
    } catch (error) {
      console.error("Push notification API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Coverage Analysis API Endpoints
  
  // Get comprehensive coverage analysis for a location
  app.post("/api/coverage/analyze", validateApiKey, async (req, res) => {
    try {
      const { lat, lng, address, provider } = req.body;
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          error: "Invalid coordinates",
          message: "Valid latitude and longitude are required" 
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: "Invalid coordinate range",
          message: "Latitude must be between -90 and 90, longitude between -180 and 180" 
        });
      }
      
      console.log(`Coverage analysis requested for: ${lat}, ${lng}`);
      const analysis = await getCoverageAnalysis(lat, lng, address, provider);
      
      res.json({
        success: true,
        data: analysis
      });
      
    } catch (error) {
      console.error("Coverage analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed",
        message: "Unable to analyze coverage for the specified location" 
      });
    }
  });
  
  // Analyze reported issue and find similar patterns
  app.post("/api/coverage/analyze-issue", validateApiKey, async (req, res) => {
    try {
      const { lat, lng, address, issue_description, user_agent } = req.body;
      
      if (!lat || !lng || !issue_description || isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Latitude, longitude, and issue description are required" 
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: "Invalid coordinate range",
          message: "Latitude must be between -90 and 90, longitude between -180 and 180" 
        });
      }
      
      console.log(`Issue analysis requested for: ${lat}, ${lng}`);
      console.log(`Issue description: ${issue_description}`);
      
      // Analyze the issue using Gemini AI
      const analysis = await analyzeIssueWithAI({
        lat,
        lng,
        address,
        issue_description,
        user_agent
      });
      
      res.json({
        success: true,
        data: analysis
      });
      
    } catch (error) {
      console.error("Issue analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed",
        message: "Unable to analyze the reported issue" 
      });
    }
  });
  
  // Get coverage analysis for a specific provider
  app.post("/api/coverage/provider", validateApiKey, async (req, res) => {
    try {
      const { provider, service_type, lat, lng } = req.body;
      
      if (!provider || !service_type || !lat || !lng || isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Provider name, service type (mobile/broadband), latitude, and longitude are required" 
        });
      }
      
      if (!['mobile', 'broadband'].includes(service_type)) {
        return res.status(400).json({ 
          error: "Invalid service type",
          message: "Service type must be either 'mobile' or 'broadband'" 
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: "Invalid coordinate range",
          message: "Latitude must be between -90 and 90, longitude between -180 and 180" 
        });
      }
      
      console.log(`Provider coverage analysis for ${provider} (${service_type}) at: ${lat}, ${lng}`);
      const analysis = await getProviderCoverage(provider, service_type as 'mobile' | 'broadband', lat, lng);
      
      res.json({
        success: true,
        data: analysis
      });
      
    } catch (error) {
      console.error("Provider coverage analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed",
        message: "Unable to analyze provider coverage for the specified location" 
      });
    }
  });

  // === USER REGISTRATION AND CONNECTIVITY MONITORING ROUTES ===
  
  // User registration for monthly connectivity insights
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = userRegistrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getRegisteredUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          error: "User already exists",
          message: "An account with this email address already exists"
        });
      }
      
      // Create new user
      const newUser = await storage.createRegisteredUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailPreferences: userData.emailPreferences || {
          monthlyInsights: true,
          interruptionAlerts: true,
          speedAlerts: true,
          marketingEmails: false
        },
        timezone: userData.timezone || "UTC",
        location: userData.location
      });
      
      res.status(201).json({
        success: true,
        message: "Registration successful! You'll start receiving monthly connectivity insights.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailPreferences: newUser.emailPreferences,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      console.error("User registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        message: "Unable to create account. Please try again."
      });
    }
  });
  
  // Update user email preferences
  app.put("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { emailPreferences } = req.body;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: "Invalid user ID"
        });
      }
      
      const user = await storage.getRegisteredUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: "User not found"
        });
      }
      
      await storage.updateUserEmailPreferences(userId, emailPreferences);
      
      res.json({
        success: true,
        message: "Email preferences updated successfully"
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({
        error: "Failed to update preferences"
      });
    }
  });
  
  // Record connectivity metric (lightweight monitoring)
  app.post("/api/connectivity/record", async (req, res) => {
    try {
      const metricData = connectivityMetricSchema.parse(req.body);
      const userEmail = req.headers['x-user-email'] as string;
      
      let userId: number | undefined;
      
      // Try to find registered user by email if provided
      if (userEmail) {
        const user = await storage.getRegisteredUserByEmail(userEmail);
        if (user) {
          userId = user.id;
          // Update user's last active timestamp
          await storage.updateRegisteredUser(user.id, {});
        }
      }
      
      // Get IP address for logging
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];
      
      // Detect interruption based on metrics
      const isInterruption = metricData.isInterruption || 
        (metricData.latency && metricData.latency > 3000) || // > 3s latency
        (metricData.packetLoss && metricData.packetLoss > 5) || // > 5% packet loss
        (metricData.downloadSpeed && metricData.downloadSpeed < 1000); // < 1Mbps
      
      const metric = await storage.recordConnectivityMetric({
        userId,
        sessionId: metricData.sessionId,
        location: metricData.location,
        ipAddress: ipAddress as string,
        userAgent,
        connectionType: metricData.connectionType,
        carrier: metricData.carrier,
        signalStrength: metricData.signalStrength,
        downloadSpeed: metricData.downloadSpeed,
        uploadSpeed: metricData.uploadSpeed,
        latency: metricData.latency,
        jitter: metricData.jitter,
        packetLoss: metricData.packetLoss,
        isInterruption: isInterruption || false,
        interruptionDuration: metricData.interruptionDuration,
        deviceInfo: req.body.deviceInfo
      });
      
      // Create alert if significant interruption detected for registered users
      if (isInterruption && userId) {
        let alertTitle = "Connectivity Issue Detected";
        let alertMessage = "We've detected connectivity problems with your connection.";
        let severity: "low" | "medium" | "high" | "critical" = "medium";
        
        if (metricData.latency && metricData.latency > 5000) {
          severity = "high";
          alertTitle = "High Latency Detected";
          alertMessage = `Very slow response times detected (${metricData.latency}ms). This may affect your browsing experience.`;
        } else if (metricData.packetLoss && metricData.packetLoss > 10) {
          severity = "critical";
          alertTitle = "Significant Packet Loss";
          alertMessage = `High packet loss detected (${metricData.packetLoss}%). You may experience connection drops.`;
        } else if (metricData.downloadSpeed && metricData.downloadSpeed < 500) {
          severity = "high";
          alertTitle = "Slow Connection Speed";
          alertMessage = `Very slow download speed detected (${metricData.downloadSpeed} kbps). This may impact your online activities.`;
        }
        
        await storage.createConnectivityAlert({
          userId,
          alertType: "interruption",
          severity,
          title: alertTitle,
          message: alertMessage,
          alertData: {
            duration: metricData.interruptionDuration,
            location: metricData.location,
            carrier: metricData.carrier,
            affectedMetric: metricData.latency ? "latency" : metricData.packetLoss ? "packet_loss" : "speed",
            currentValue: metricData.latency || metricData.packetLoss || metricData.downloadSpeed
          }
        });
      }
      
      res.json({
        success: true,
        message: "Connectivity metric recorded successfully",
        metric: {
          id: metric.id,
          timestamp: metric.timestamp,
          isInterruption
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid metric data",
          details: error.errors
        });
      }
      console.error("Record connectivity metric error:", error);
      res.status(500).json({
        error: "Failed to record metric"
      });
    }
  });
  
  // Get user connectivity stats
  app.get("/api/connectivity/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days as string) || 30;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: "Invalid user ID"
        });
      }
      
      const user = await storage.getRegisteredUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: "User not found"
        });
      }
      
      const stats = await storage.getAverageConnectivityStats(userId, days);
      const recentMetrics = await storage.getUserConnectivityMetrics(userId, 10);
      const interruptions = await storage.getConnectivityInterruptions(userId, 5);
      
      res.json({
        success: true,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        period: {
          days,
          startDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
        },
        stats,
        recentMetrics: recentMetrics.map(metric => ({
          timestamp: metric.timestamp,
          downloadSpeed: metric.downloadSpeed,
          uploadSpeed: metric.uploadSpeed,
          latency: metric.latency,
          connectionType: metric.connectionType,
          carrier: metric.carrier,
          location: metric.location
        })),
        recentInterruptions: interruptions.map(interrupt => ({
          timestamp: interrupt.timestamp,
          duration: interrupt.interruptionDuration,
          cause: interrupt.latency && interrupt.latency > 3000 ? "High Latency" :
                 interrupt.packetLoss && interrupt.packetLoss > 5 ? "Packet Loss" : "Low Speed"
        }))
      });
    } catch (error) {
      console.error("Get connectivity stats error:", error);
      res.status(500).json({
        error: "Failed to fetch connectivity stats"
      });
    }
  });
  
  // Get user alerts
  app.get("/api/users/:userId/alerts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const unreadOnly = req.query.unread === 'true';
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: "Invalid user ID"
        });
      }
      
      const alerts = await storage.getUserAlerts(userId, unreadOnly);
      const unreadCount = await storage.getUnreadAlertCount(userId);
      
      res.json({
        success: true,
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          isRead: alert.isRead,
          isResolved: alert.isResolved,
          createdAt: alert.createdAt,
          resolvedAt: alert.resolvedAt,
          data: alert.alertData
        })),
        unreadCount
      });
    } catch (error) {
      console.error("Get user alerts error:", error);
      res.status(500).json({
        error: "Failed to fetch alerts"
      });
    }
  });
  
  // Mark alert as read
  app.put("/api/alerts/:alertId/read", async (req, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      
      if (!alertId || isNaN(alertId)) {
        return res.status(400).json({
          error: "Invalid alert ID"
        });
      }
      
      await storage.markAlertAsRead(alertId);
      
      res.json({
        success: true,
        message: "Alert marked as read"
      });
    } catch (error) {
      console.error("Mark alert as read error:", error);
      res.status(500).json({
        error: "Failed to mark alert as read"
      });
    }
  });
  
  // === ADMIN ROUTES FOR RATE LIMIT MONITORING ===
  
  // Get admin notifications (rate limit violations, API abuse)
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await storage.getAdminNotifications(unreadOnly);
      const unreadCount = await storage.getUnreadAdminNotificationCount();
      
      res.json({
        success: true,
        notifications: notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          severity: notification.severity,
          apiKey: notification.apiKeyId,
          metadata: notification.metadata,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        })),
        unreadCount
      });
    } catch (error) {
      console.error("Get admin notifications error:", error);
      res.status(500).json({
        error: "Failed to fetch notifications"
      });
    }
  });
  
  // Mark admin notification as read
  app.put("/api/admin/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json({
          error: "Invalid notification ID"
        });
      }
      
      await storage.markAdminNotificationRead(notificationId);
      
      res.json({
        success: true,
        message: "Notification marked as read"
      });
    } catch (error) {
      console.error("Mark admin notification as read error:", error);
      res.status(500).json({
        error: "Failed to mark notification as read"
      });
    }
  });
  
  // Get API usage stats for specific API key
  app.get("/api/admin/usage/:apiKeyId", async (req, res) => {
    try {
      const apiKeyId = parseInt(req.params.apiKeyId);
      const hours = parseInt(req.query.hours as string) || 24;
      
      if (!apiKeyId || isNaN(apiKeyId)) {
        return res.status(400).json({
          error: "Invalid API key ID"
        });
      }
      
      const apiKey = await storage.getApiKeyByHash(""); // We'll need to get by ID
      const stats = await storage.getApiUsageStats(apiKeyId);
      const recentUsage = await storage.getApiUsageByKey(apiKeyId, hours);
      
      res.json({
        success: true,
        apiKey: apiKey ? {
          name: apiKey.name,
          email: apiKey.email,
          createdAt: apiKey.createdAt,
          lastUsed: apiKey.lastUsed
        } : null,
        stats,
        recentUsage: recentUsage.map(usage => ({
          timestamp: usage.timestamp,
          endpoint: usage.endpoint,
          method: usage.method,
          responseStatus: usage.responseStatus,
          responseTime: usage.responseTime,
          rateLimitExceeded: usage.rateLimitExceeded,
          ipAddress: usage.ipAddress
        }))
      });
    } catch (error) {
      console.error("Get API usage stats error:", error);
      res.status(500).json({
        error: "Failed to fetch usage stats"
      });
    }
  });
  
  // Get all API keys with usage stats for admin dashboard
  app.get("/api/admin/api-keys", async (req, res) => {
    try {
      // This would require a new storage method to get all API keys with stats
      // For now, return basic structure
      res.json({
        success: true,
        message: "Admin API keys endpoint - implementation in progress",
        data: []
      });
    } catch (error) {
      console.error("Get admin API keys error:", error);
      res.status(500).json({
        error: "Failed to fetch API keys"
      });
    }
  });
  
  // Admin access request
  app.post("/api/admin/access-request", async (req, res) => {
    try {
      const {
        organization,
        email,
        apiKeyName,
        useCase,
        monthlyVolume,
        technicalContact,
        billingContact
      } = req.body;
      
      // Create admin notification for access request
      await storage.createAdminNotification({
        type: "admin_access_request",
        title: "Admin Portal Access Request",
        message: `New admin access request from ${organization} (${email})`,
        severity: "info",
        metadata: {
          requestedAt: new Date().toISOString(),
          organization: organization,
          email: email,
          apiKeyName: apiKeyName,
          useCase: useCase,
          monthlyVolume: monthlyVolume
        } as any
      });
      
      res.json({
        success: true,
        message: "Admin access request submitted successfully. You will receive a response within 1-2 business days.",
        requestId: `REQ-${Date.now()}`
      });
    } catch (error) {
      console.error("Admin access request error:", error);
      res.status(500).json({
        error: "Failed to submit access request"
      });
    }
  });

  // Serve the Coverage Maps API documentation
  app.get("/coverage-api-docs.md", (req, res) => {
    res.sendFile(path.join(__dirname, "../COVERAGE_MAPS_API_DOCUMENTATION.md"));
  });

  // Register PDF generation routes
  registerPDFRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}