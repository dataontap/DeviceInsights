import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { MVNO } from './config/mvno';

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
import { matchDeviceToTAC, getExampleIMEIFromTAC } from './services/device-matcher.js';
import { getCarrierPricing } from './services/pricing-service.js';
import { getCoverageQualityForCarriers } from './services/coverage-quality-service.js';
import { getLocationFromIp } from './services/ip-geolocation.js';
import { 
  generateVoiceAudio, 
  createMultiVoiceConversation, 
  getUSSDInstructions, 
  getVoicesForLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_VOICE_AGENTS,
  type VoiceConfig,
  type ConversationMessage 
} from './services/elevenlabs.js';
import { analyzeIssueWithAI } from './services/issue-analyzer.js';
import { standardRateLimit, mcpRateLimit, premiumRateLimit } from './middleware/enhanced-rate-limit';
import { insertImeiSearchSchema, insertPolicyAcceptanceSchema, generateApiKeySchema, magicLinkRequestSchema, userRegistrationSchema, connectivityMetricSchema, publicBlacklistCreateSchema } from "@shared/schema";
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

    // Check if origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    } else {
      // Explicitly reject disallowed origins
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
    }
  });

  // API Documentation endpoint
  app.get("/api/v1/docs", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      name: "IMEI Device Checker API",
      version: "1.0.0-alpha",
      status: "ALPHA - Use with caution",
      description: "AI-powered IMEI analysis and network compatibility checking (Alpha version)",
      disclaimer: "⚠️ ALPHA VERSION: This service is in early testing phase. Results are tentative and should be treated with caution. Use at your own discretion.",
      baseUrl: baseUrl,
      rateLimits: {
        perHour: 100,
        note: "100 requests per hour per IP address"
      },
      authentication: {
        type: "Bearer Token",
        header: "Authorization: Bearer YOUR_API_KEY",
        note: "API keys must be generated through the admin dashboard. Keys start with 'imei_' prefix.",
        howToGetKey: "Visit the admin dashboard to generate an API key for your application"
      },
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/check",
          description: "Analyze IMEI device compatibility across carriers",
          authentication: "Required",
          parameters: {
            imei: {
              type: "string",
              required: true,
              description: "15-digit IMEI number",
              example: "123456789012345"
            },
            location: {
              type: "string",
              required: false,
              description: "Location for carrier analysis",
              example: "San Francisco, CA"
            },
            network: {
              type: "string",
              required: false,
              description: "Target carrier network",
              example: "AT&T"
            }
          },
          example: {
            curl: `curl -X POST ${baseUrl}/api/v1/check \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{"imei": "123456789012345", "location": "San Francisco, CA"}'`,
            javascript: `fetch('${baseUrl}/api/v1/check', {
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
          }
        },
        {
          method: "POST",
          path: "/api/v1/coverage-quality",
          description: "Get network quality metrics (signal strength, speeds, latency) for carriers by location",
          authentication: "Required",
          parameters: {
            carriers: {
              type: "array",
              required: true,
              description: "Array of carrier names to check",
              example: ["AT&T", "Verizon", "T-Mobile"]
            },
            location: {
              type: "string",
              required: false,
              description: "Location (city, address). If omitted, location is automatically detected from your IP address.",
              example: "New York, NY"
            },
            coordinates: {
              type: "object",
              required: false,
              description: "GPS coordinates for enhanced accuracy",
              example: { lat: 40.7128, lng: -74.0060 }
            }
          },
          response: {
            success: "boolean",
            location: "string - resolved location",
            coordinates: "object - { lat, lng }",
            carriers: "object - quality metrics by carrier name",
            carrierCount: "number - number of carriers analyzed",
            detectedFromIp: "boolean - true if location was auto-detected"
          },
          carrierQualityFormat: {
            fiveG: {
              available: "boolean",
              signalStrength: "number (0-100)",
              quality: "string (excellent|good|fair|poor)",
              downloadSpeed: "string (e.g., '500 Mbps')",
              uploadSpeed: "string",
              latency: "string (e.g., '15ms')"
            },
            fourG: "same format as 5G",
            threeG: "same format as 5G",
            lastUpdated: "ISO timestamp"
          },
          example: {
            curl: `curl -X POST ${baseUrl}/api/v1/coverage-quality \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "carriers": ["AT&T", "Verizon", "T-Mobile"],
    "location": "Los Angeles, CA"
  }'`,
            javascript: `fetch('${baseUrl}/api/v1/coverage-quality', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    carriers: ['AT&T', 'Verizon', 'T-Mobile'],
    location: 'Los Angeles, CA'
  })
})`,
            responseExample: {
              success: true,
              location: "Los Angeles, CA",
              coordinates: { lat: 34.0522, lng: -118.2437 },
              carrierCount: 3,
              detectedFromIp: false,
              carriers: {
                "AT&T": {
                  fiveG: {
                    available: true,
                    signalStrength: 85,
                    quality: "excellent",
                    downloadSpeed: "450 Mbps",
                    uploadSpeed: "50 Mbps",
                    latency: "18ms"
                  },
                  fourG: {
                    available: true,
                    signalStrength: 92,
                    quality: "excellent",
                    downloadSpeed: "85 Mbps",
                    uploadSpeed: "25 Mbps",
                    latency: "35ms"
                  },
                  threeG: {
                    available: false
                  },
                  lastUpdated: "2025-01-07T16:53:00.000Z"
                }
              }
            }
          }
        },
        {
          method: "GET",
          path: "/api/v1/stats",
          description: "Get your API key's usage statistics",
          authentication: "Required",
          parameters: {},
          example: {
            curl: `curl -X GET ${baseUrl}/api/v1/stats \\
  -H "Authorization: Bearer your-api-key"`
          }
        },
        {
          method: "GET",
          path: "/api/v1/export",
          description: "Export your search data (CSV format)",
          authentication: "Required"
        },
        {
          method: "GET",
          path: "/api/v1/search/{id}",
          description: "Get individual search details (your searches only)",
          authentication: "Required"
        },
        {
          method: "GET",
          path: "/api/v1/my/searches",
          description: "Get your detailed search data with location info",
          authentication: "Required"
        },
        {
          method: "GET",
          path: "/api/v1/blacklist",
          description: "Get your local blacklisted IMEIs (API key specific)",
          authentication: "Required",
          parameters: {},
          response: {
            success: true,
            scope: "local",
            apiKeyId: "number",
            count: "number",
            blacklist: "array of blacklisted IMEI objects"
          },
          example: {
            curl: `curl -X GET ${baseUrl}/api/v1/blacklist \\
  -H "Authorization: Bearer your-api-key"`
          }
        },
        {
          method: "POST",
          path: "/api/v1/blacklist",
          description: "Add IMEI to your local blacklist (API key specific)",
          authentication: "Required",
          parameters: {
            imei: {
              type: "string",
              required: true,
              description: "15-digit IMEI number to blacklist",
              example: "123456789012345"
            },
            reason: {
              type: "string",
              required: true,
              description: "Reason for blacklisting this IMEI",
              example: "Reported stolen device"
            },
            scope: {
              type: "string",
              required: false,
              description: "Must be 'local' for API keys (global requires admin)",
              default: "local",
              example: "local"
            }
          },
          example: {
            curl: `curl -X POST ${baseUrl}/api/v1/blacklist \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{"imei": "123456789012345", "reason": "Reported stolen device", "scope": "local"}'`,
            javascript: `fetch('${baseUrl}/api/v1/blacklist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    imei: '123456789012345',
    reason: 'Reported stolen device',
    scope: 'local'
  })
})`
          }
        },
        {
          method: "DELETE",
          path: "/api/v1/blacklist/{imei}",
          description: "Remove IMEI from your local blacklist (API key specific)",
          authentication: "Required",
          parameters: {
            imei: {
              type: "string",
              required: true,
              description: "15-digit IMEI number to remove from blacklist",
              example: "123456789012345"
            }
          },
          example: {
            curl: `curl -X DELETE ${baseUrl}/api/v1/blacklist/123456789012345 \\
  -H "Authorization: Bearer your-api-key"`
          }
        }
      ],
      important: {
        alphaWarning: "This is an Alpha service. All results are tentative and experimental.",
        dataAccuracy: "Device compatibility information may not be 100% accurate.",
        useAtOwnRisk: "Users acknowledge they use this service at their own discretion.",
        locationDetection: "The coverage-quality endpoint can automatically detect your location if not provided, ensuring accurate network quality metrics."
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

      // Cache the result for 30 days (720 hours)
      await storage.setCachedCarriers(country, carriersData, 720);

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

  // Get pricing plans for carriers
  app.post("/api/pricing-plans", async (req, res) => {
    try {
      const { country, carriers } = req.body;
      
      if (!country) {
        return res.status(400).json({ error: "Country is required" });
      }

      // Check cache first
      const cached = await storage.getCachedPricing(country);
      if (cached && cached.pricingData) {
        console.log(`Pricing cache hit for country: ${country}`);
        return res.json({
          ...cached.pricingData,
          cached: true
        });
      }

      // Cache miss - fetch from AI
      console.log(`Pricing cache miss for country: ${country}, fetching from AI`);
      const pricingData = await getCarrierPricing(country, carriers);

      // Cache the result for 24 hours
      await storage.setCachedPricing(country, pricingData, 24);

      res.json({
        ...pricingData,
        cached: false
      });
    } catch (error) {
      console.error("Pricing fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch pricing plans",
        message: "Could not retrieve carrier pricing information"
      });
    }
  });

  // Get coverage quality metrics for carriers by location (internal endpoint)
  app.post("/api/coverage-quality", async (req, res) => {
    try {
      const { carriers, location, coordinates } = req.body;
      
      if (!carriers || !Array.isArray(carriers) || carriers.length === 0) {
        return res.status(400).json({ error: "Carriers array is required" });
      }
      
      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }

      console.log(`Fetching coverage quality for ${carriers.length} carriers in ${location}`);
      const qualityData = await getCoverageQualityForCarriers(carriers, location, coordinates);

      res.json({
        success: true,
        data: qualityData
      });
    } catch (error) {
      console.error("Coverage quality fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch coverage quality metrics",
        message: "Could not retrieve coverage quality information"
      });
    }
  });

  // Public API: Get coverage quality metrics with auto IP geolocation
  app.post("/api/v1/coverage-quality", validateApiKey, standardRateLimit, async (req, res) => {
    try {
      const { carriers, location, coordinates } = req.body;
      
      if (!carriers || !Array.isArray(carriers) || carriers.length === 0) {
        return res.status(400).json({ 
          error: "Carriers array is required",
          message: "Please provide an array of carrier names (e.g., ['AT&T', 'Verizon', 'T-Mobile'])"
        });
      }

      let resolvedLocation = location;
      let resolvedCoordinates = coordinates;

      if (!resolvedLocation) {
        const ipAddress = 
          req.get('CF-Connecting-IP') ||
          req.get('X-Real-IP') ||
          req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
          req.ip ||
          req.connection?.remoteAddress ||
          'unknown';

        console.log(`[API v1] No location provided, attempting IP geolocation for ${ipAddress}`);
        
        const geoData = await getLocationFromIp(ipAddress);
        
        if (geoData) {
          resolvedLocation = geoData.location;
          resolvedCoordinates = geoData.coordinates;
          console.log(`[API v1] IP geolocation successful: ${resolvedLocation}`);
        } else {
          return res.status(400).json({
            error: "Location required",
            message: "Please provide a location parameter, or ensure your IP address can be geolocated",
            ipAddress: ipAddress
          });
        }
      }

      console.log(`[API v1] Fetching coverage quality for ${carriers.length} carriers in ${resolvedLocation}`);
      const qualityData = await getCoverageQualityForCarriers(carriers, resolvedLocation, resolvedCoordinates);

      res.json({
        success: true,
        location: resolvedLocation,
        coordinates: resolvedCoordinates,
        carriers: qualityData,
        carrierCount: carriers.length,
        detectedFromIp: !location
      });
    } catch (error) {
      console.error("[API v1] Coverage quality fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch coverage quality metrics",
        message: "Could not retrieve coverage quality information. Please try again later."
      });
    }
  });

  // Auto-detect device from browser information
  app.post("/api/detect-device", async (req, res) => {
    try {
      const { deviceModel, userAgent, location } = req.body;
      
      // Get real client IP - check proxy headers first for production environments
      let ipAddress = 
        req.get('CF-Connecting-IP') || // Cloudflare
        req.get('X-Real-IP') || // Nginx proxy
        req.get('X-Forwarded-For')?.split(',')[0]?.trim() || // Standard proxy header
        req.ip || 
        req.connection?.remoteAddress || 
        'unknown';
      
      // Clean up IPv6-mapped IPv4 addresses
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
      }
      
      console.log('Device detection - IP:', ipAddress, 'Device:', deviceModel);
      
      // Match device model to TAC
      const deviceMatch = matchDeviceToTAC(deviceModel || '');
      
      // Prepare response
      const response: any = {
        success: true,
        ipAddress: ipAddress,
        userAgent: userAgent || req.get('User-Agent') || 'unknown',
        location: location,
        deviceDetected: true, // Always true if we have any device info
      };
      
      // Always include device info if available
      if (deviceMatch.found && deviceMatch.tac) {
        // Matched to known device with TAC
        response.device = {
          make: deviceMatch.deviceInfo?.make,
          model: deviceMatch.deviceInfo?.model,
          tac: deviceMatch.tac,
          exampleImei: getExampleIMEIFromTAC(deviceMatch.tac)
        };
      } else if (deviceModel) {
        // Device detected but no TAC match - still show generic info
        // Parse basic make/model from deviceModel string
        let make = 'Unknown';
        let model = deviceModel;
        
        if (deviceModel.toLowerCase().includes('iphone') || deviceModel.toLowerCase().includes('ipad')) {
          make = 'Apple';
        } else if (deviceModel.toLowerCase().includes('samsung') || deviceModel.toLowerCase().includes('galaxy')) {
          make = 'Samsung';
        } else if (deviceModel.toLowerCase().includes('pixel')) {
          make = 'Google';
        } else if (deviceModel.toLowerCase().includes('oneplus')) {
          make = 'OnePlus';
        } else if (deviceModel.toLowerCase().includes('android')) {
          make = 'Android';
          model = 'Device';
        }
        
        response.device = {
          make: make,
          model: model,
          tac: null,
          exampleImei: null
        };
      }
      
      // Try to get ISP from IP using cache-first approach
      // Skip private/local IP ranges (RFC1918 + link-local)
      const isPrivateIP = ipAddress === 'unknown' || 
        ipAddress.startsWith('127.') ||      // Loopback
        ipAddress.startsWith('192.168.') ||  // Private
        ipAddress.startsWith('10.') ||       // Private
        ipAddress.startsWith('172.16.') ||   // Private
        ipAddress.startsWith('172.17.') ||   // Private
        ipAddress.startsWith('172.18.') ||   // Private
        ipAddress.startsWith('172.19.') ||   // Private
        ipAddress.startsWith('172.20.') ||   // Private
        ipAddress.startsWith('172.21.') ||   // Private
        ipAddress.startsWith('172.22.') ||   // Private
        ipAddress.startsWith('172.23.') ||   // Private
        ipAddress.startsWith('172.24.') ||   // Private
        ipAddress.startsWith('172.25.') ||   // Private
        ipAddress.startsWith('172.26.') ||   // Private
        ipAddress.startsWith('172.27.') ||   // Private
        ipAddress.startsWith('172.28.') ||   // Private
        ipAddress.startsWith('172.29.') ||   // Private
        ipAddress.startsWith('172.30.') ||   // Private
        ipAddress.startsWith('172.31.') ||   // Private
        ipAddress.startsWith('169.254.');    // Link-local
      
      if (!isPrivateIP) {
        // Check cache first
        const cachedIspData = await storage.getCachedIspData(ipAddress);
        
        if (cachedIspData && cachedIspData.ispData) {
          // Cache hit - use cached data
          console.log(`ISP cache HIT for IP: ${ipAddress}`);
          response.isp = cachedIspData.ispData.isp;
          response.city = cachedIspData.ispData.city;
          response.region = cachedIspData.ispData.region;
          response.country = cachedIspData.ispData.country;
        } else {
          // Cache miss - fetch from external APIs
          console.log(`ISP cache MISS for IP: ${ipAddress}`);
          let ispLookupSuccess = false;
          let ispDataToCache: any = {};
          
          try {
            // Use ip-api.com Pro with unlimited requests
            const ipApiKey = process.env.IP_API_KEY;
            if (!ipApiKey) {
              throw new Error('IP_API_KEY not configured');
            }
            
            const ipApiResponse = await fetch(`https://pro.ip-api.com/json/${ipAddress}?key=${ipApiKey}&fields=status,country,regionName,city,isp,org,as,mobile`);
            if (ipApiResponse.ok) {
              const ipData = await ipApiResponse.json();
              if (ipData.status === 'success') {
                response.isp = ipData.isp || ipData.org || ipData.as || 'Unknown ISP';
                response.city = ipData.city;
                response.region = ipData.regionName;
                response.country = ipData.country;
                
                // Prepare data for caching
                ispDataToCache = {
                  isp: response.isp,
                  org: ipData.org,
                  as: ipData.as,
                  city: ipData.city,
                  region: ipData.regionName,
                  country: ipData.country,
                  mobile: ipData.mobile
                };
                
                console.log('ISP lookup success (Pro API):', response.isp);
                ispLookupSuccess = true;
              } else {
                console.log('ip-api.com Pro returned non-success status:', ipData.status);
              }
            }
          } catch (error) {
            console.log('ip-api.com Pro lookup failed:', error);
          }
          
          // If primary lookup failed, try fallback
          if (!ispLookupSuccess) {
            try {
              const fallbackResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
              if (fallbackResponse.ok) {
                const ipData = await fallbackResponse.json();
                if (!ipData.error) {
                  response.isp = ipData.org || 'Unknown ISP';
                  response.city = ipData.city;
                  response.region = ipData.region;
                  response.country = ipData.country_name;
                  
                  // Prepare data for caching
                  ispDataToCache = {
                    isp: response.isp,
                    org: ipData.org,
                    city: ipData.city,
                    region: ipData.region,
                    country: ipData.country_name
                  };
                  
                  console.log('ISP lookup success (fallback):', response.isp);
                  ispLookupSuccess = true;
                }
              }
            } catch (fallbackError) {
              console.log('Fallback ISP lookup also failed:', fallbackError);
            }
          }
          
          // Cache the result if lookup was successful (24 hour TTL)
          if (ispLookupSuccess && ispDataToCache.isp) {
            try {
              await storage.setCachedIspData(ipAddress, ispDataToCache, 24);
              console.log(`Cached ISP data for IP: ${ipAddress} (24h TTL)`);
            } catch (cacheError) {
              console.error('Failed to cache ISP data:', cacheError);
              // Don't fail the request if caching fails
            }
          }
        }
      }
      
      // If still no ISP, set default
      if (!response.isp) {
        response.isp = 'Unknown ISP';
      }
      
      res.json(response);
    } catch (error) {
      console.error("Device detection error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to detect device",
        message: "Could not process device detection request"
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
        // Analyze device using AI with specified network (default from MVNO config)
        const targetNetwork = network || MVNO.internationalCarrier;
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

        // Check if this is a popular device and get search count
        const [isPopular, searchCount] = await Promise.all([
          storage.isPopularDevice(deviceInfo.make || '', deviceInfo.model || ''),
          storage.getDeviceSearchCount(deviceInfo.make || '', deviceInfo.model || '')
        ]);

        res.json({
          success: true,
          searchId: search.id,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            modelNumber: deviceInfo.modelNumber,
            imei: imei,
            isPopular: isPopular,
            searchCount: searchCount,
            esimSupport: deviceInfo.esimSupport
          },
          esimSupport: deviceInfo.esimSupport,
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

      // Check if IMEI is blacklisted (checks both global and API-key specific blacklists)
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      const blacklistedImei = await storage.isImeiBlacklisted(imei, apiKeyId);
      if (blacklistedImei) {
        const isGlobal = blacklistedImei.apiKeyId === null;
        return res.status(403).json({ 
          error: "Blacklisted IMEI",
          message: isGlobal 
            ? "It looks like the device IMEI you provided is on the global 'naughty list'. Please contact support."
            : "It looks like the device IMEI you provided is on your local 'naughty list'.",
          success: false,
          blacklisted: true,
          scope: isGlobal ? "global" : "local",
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
          apiKeyId: apiKeyId, // Associate with the API key
        };

        const search = await storage.createImeiSearch(searchData);

        // Check if this is a popular device and get search count
        const [isPopular, searchCount] = await Promise.all([
          storage.isPopularDevice(deviceInfo.make || '', deviceInfo.model || ''),
          storage.getDeviceSearchCount(deviceInfo.make || '', deviceInfo.model || '')
        ]);

        res.json({
          success: true,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            modelNumber: deviceInfo.modelNumber,
            imei: imei,
            isPopular: isPopular,
            searchCount: searchCount,
            esimSupport: deviceInfo.esimSupport
          },
          esimSupport: deviceInfo.esimSupport,
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

  // eSIM Compatibility Check - Lightweight endpoint for checking eSIM support only
  app.post("/api/v1/esim-check", validateApiKey, standardRateLimit, async (req, res) => {
    try {
      const { imei } = req.body;

      if (!imei) {
        return res.status(400).json({ 
          error: "IMEI is required",
          message: "Please provide an IMEI number" 
        });
      }

      // Validate IMEI format
      if (!validateIMEI(imei)) {
        return res.status(400).json({ 
          error: "Invalid IMEI format",
          message: "The IMEI number format is invalid" 
        });
      }

      // First try to match against local TAC database (fastest)
      const tacMatch = matchDeviceToTAC(imei);
      
      if (tacMatch.found && tacMatch.deviceInfo) {
        // Get device info from TAC database
        const deviceInfo = await analyzeIMEI(imei, "AT&T");
        
        // Found in TAC database - return with full device info including eSIM support
        return res.json({
          success: true,
          imei,
          esimSupport: deviceInfo.esimSupport ?? false,
          device: {
            make: tacMatch.deviceInfo.make,
            model: tacMatch.deviceInfo.model,
            year: tacMatch.deviceInfo.year
          },
          source: "tac_database",
          message: deviceInfo.esimSupport 
            ? "This device supports eSIM technology" 
            : "This device does not support eSIM"
        });
      }

      // If not in TAC database, use AI analysis (slower but comprehensive)
      try {
        const deviceInfo = await analyzeIMEI(imei, "AT&T"); // Network doesn't affect eSIM support
        
        return res.json({
          success: true,
          imei,
          esimSupport: deviceInfo.esimSupport ?? false,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year
          },
          source: "ai_analysis",
          message: deviceInfo.esimSupport 
            ? "This device supports eSIM technology" 
            : "This device does not support eSIM"
        });
      } catch (aiError) {
        console.error("eSIM AI analysis error:", aiError);
        
        // Return unknown status if AI fails
        return res.json({
          success: true,
          imei,
          esimSupport: false,
          device: {
            make: "Unknown",
            model: "Unknown Device",
            year: null
          },
          source: "unknown",
          message: "Unable to determine eSIM support for this device",
          warning: "Device information could not be verified"
        });
      }
    } catch (error) {
      console.error("eSIM check error:", error);
      res.status(500).json({ 
        error: "Failed to check eSIM compatibility",
        message: "An error occurred while checking eSIM support" 
      });
    }
  });

  // Batch eSIM Compatibility Check - Process multiple IMEIs at once
  app.post("/api/v1/esim-check/batch", validateApiKey, standardRateLimit, async (req, res) => {
    try {
      const { imeis } = req.body;

      if (!imeis || !Array.isArray(imeis)) {
        return res.status(400).json({ 
          error: "Invalid request",
          message: "Please provide an array of IMEI numbers" 
        });
      }

      if (imeis.length === 0) {
        return res.status(400).json({ 
          error: "Empty batch",
          message: "Please provide at least one IMEI number" 
        });
      }

      if (imeis.length > 100) {
        return res.status(400).json({ 
          error: "Batch too large",
          message: "Maximum 100 IMEIs per batch request" 
        });
      }

      const results = [];
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const imei of imeis) {
        try {
          processedCount++;

          // Validate IMEI format
          if (!validateIMEI(imei)) {
            results.push({
              imei,
              success: false,
              error: "Invalid IMEI format",
              esimSupport: null,
              device: null
            });
            errorCount++;
            continue;
          }

          // First try to match against local TAC database (fastest)
          const tacMatch = matchDeviceToTAC(imei);
          
          if (tacMatch.found && tacMatch.deviceInfo) {
            // Get device info from TAC database
            const deviceInfo = await analyzeIMEI(imei, "AT&T");
            
            results.push({
              imei,
              success: true,
              esimSupport: deviceInfo.esimSupport ?? false,
              device: {
                make: tacMatch.deviceInfo.make,
                model: tacMatch.deviceInfo.model,
                year: tacMatch.deviceInfo.year
              },
              source: "tac_database"
            });
            successCount++;
            continue;
          }

          // If not in TAC database, use AI analysis
          try {
            const deviceInfo = await analyzeIMEI(imei, "AT&T");
            
            results.push({
              imei,
              success: true,
              esimSupport: deviceInfo.esimSupport ?? false,
              device: {
                make: deviceInfo.make,
                model: deviceInfo.model,
                year: deviceInfo.year
              },
              source: "ai_analysis"
            });
            successCount++;
          } catch (aiError) {
            console.error(`eSIM AI analysis error for ${imei}:`, aiError);
            
            results.push({
              imei,
              success: true,
              esimSupport: false,
              device: {
                make: "Unknown",
                model: "Unknown Device",
                year: null
              },
              source: "unknown",
              warning: "Device information could not be verified"
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing IMEI ${imei}:`, error);
          results.push({
            imei,
            success: false,
            error: "Processing error",
            esimSupport: null,
            device: null
          });
          errorCount++;
        }
      }

      res.json({
        success: true,
        summary: {
          total: imeis.length,
          processed: processedCount,
          successful: successCount,
          errors: errorCount,
          esimCompatible: results.filter(r => r.esimSupport === true).length,
          esimNotCompatible: results.filter(r => r.esimSupport === false).length
        },
        results
      });
    } catch (error) {
      console.error("Batch eSIM check error:", error);
      res.status(500).json({ 
        error: "Failed to process batch eSIM check",
        message: "An error occurred while processing the batch request" 
      });
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

  // Export search data (provides example data without API key, real data with valid API key)
  app.get("/api/v1/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const limit = parseInt(req.query.limit as string) || 1000;

      // Check if API key is provided
      const authHeader = req.headers.authorization;
      const apiKey = authHeader?.replace('Bearer ', '');
      let isAuthenticated = false;
      let apiKeyId: number | undefined;
      let apiKeyName: string | undefined;

      // Try to validate API key if provided
      if (apiKey && apiKey.trim() !== '' && apiKey.startsWith('imei_')) {
        try {
          const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
          const storedKey = await storage.getApiKeyByHash(keyHash);
          
          if (storedKey && storedKey.isActive) {
            isAuthenticated = true;
            apiKeyId = storedKey.id;
            apiKeyName = storedKey.name || 'Your API Key';
          }
        } catch (error) {
          console.log("API key validation failed, returning example data");
        }
      }

      let searches: any[];
      let isExampleData = !isAuthenticated;

      if (isAuthenticated && apiKeyId) {
        // Return real data for authenticated users
        searches = await storage.getImeiSearchesByApiKey(apiKeyId, limit);
      } else {
        // Return anonymized example data for unauthenticated users
        const now = new Date();
        searches = [
          {
            id: 1,
            imei: '123456789012345',
            deviceMake: 'Apple',
            deviceModel: 'iPhone 15 Pro',
            deviceYear: '2023',
            searchLocation: 'New York, USA',
            ipAddress: '192.0.2.1',
            searchedAt: new Date(now.getTime() - 86400000 * 7) // 7 days ago
          },
          {
            id: 2,
            imei: '234567890123456',
            deviceMake: 'Samsung',
            deviceModel: 'Galaxy S24 Ultra',
            deviceYear: '2024',
            searchLocation: 'Los Angeles, USA',
            ipAddress: '192.0.2.2',
            searchedAt: new Date(now.getTime() - 86400000 * 5) // 5 days ago
          },
          {
            id: 3,
            imei: '345678901234567',
            deviceMake: 'Google',
            deviceModel: 'Pixel 8 Pro',
            deviceYear: '2023',
            searchLocation: 'Chicago, USA',
            ipAddress: '192.0.2.3',
            searchedAt: new Date(now.getTime() - 86400000 * 3) // 3 days ago
          },
          {
            id: 4,
            imei: '456789012345678',
            deviceMake: 'OnePlus',
            deviceModel: 'OnePlus 11',
            deviceYear: '2023',
            searchLocation: 'Houston, USA',
            ipAddress: '192.0.2.4',
            searchedAt: new Date(now.getTime() - 86400000 * 2) // 2 days ago
          },
          {
            id: 5,
            imei: '567890123456789',
            deviceMake: 'Apple',
            deviceModel: 'iPhone 14 Pro Max',
            deviceYear: '2022',
            searchLocation: 'Miami, USA',
            ipAddress: '192.0.2.5',
            searchedAt: new Date(now.getTime() - 86400000) // 1 day ago
          }
        ];
      }

      if (format === 'csv') {
        const exampleNotice = isExampleData 
          ? '# EXAMPLE DATA - Sign up for a free API key to export your real search data\n# Get your API key at: ' + (req.get('origin') || 'https://dotmobile.app') + '\n'
          : '';
        
        const csvData = [
          exampleNotice + 'ID,IMEI,Device Make,Device Model,Device Year,Search Location,IP Address,Searched At',
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
        const filename = isExampleData ? 'imei_searches_example.csv' : 'my_imei_searches.csv';
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csvData);
      } else {
        res.json({
          isExampleData,
          notice: isExampleData ? 'This is example data. Sign up for a free API key to export your real search data.' : undefined,
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
          apiKeyName: isExampleData ? 'Example Data' : apiKeyName,
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

      const { email, name, website } = generateApiKeySchema.parse(req.body);

      // SECURITY: Additional validation and sanitization
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedWebsite = website?.trim().substring(0, 200);

      // Auto-generate name if not provided (Key1, Key2, etc.)
      let finalName: string;
      if (name && name.trim().length > 0) {
        finalName = name.trim().substring(0, 100);
      } else {
        // Count existing keys for this email to generate sequential name
        const allKeys = await storage.getAllApiKeys();
        const userKeys = allKeys.filter(k => k.email === sanitizedEmail);
        const keyNumber = userKeys.length + 1;
        finalName = `Key${keyNumber}`;
      }

      // Generate unique API key with stronger entropy
      const apiKey = `imei_${nanoid(24)}_${Date.now()}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Store in database with sanitized data
      const storedKey = await storage.createApiKey({
        key: apiKey,
        keyHash,
        email: sanitizedEmail,
        name: finalName,
        website: sanitizedWebsite,
      });

      res.json({
        success: true,
        apiKey: apiKey,
        keyId: storedKey.id,
        email: storedKey.email,
        name: storedKey.name,
        website: storedKey.website,
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

  // ===== Blacklist Management Public API =====
  
  // Get blacklisted IMEIs (API key specific - returns only local blacklist for this API key)
  app.get("/api/v1/blacklist", validateApiKey, async (req, res) => {
    try {
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      // Get only local blacklist for this API key
      const blacklistedImeis = await storage.getLocalBlacklistedImeis(apiKeyId);

      res.json({
        success: true,
        scope: "local",
        apiKeyId,
        count: blacklistedImeis.length,
        blacklist: blacklistedImeis.map(item => ({
          id: item.id,
          imei: item.imei,
          reason: item.reason,
          blacklistedAt: item.blacklistedAt,
          addedBy: item.addedBy
        }))
      });
    } catch (error) {
      console.error("Blacklist fetch error:", error);
      res.status(500).json({ error: "Failed to fetch blacklist" });
    }
  });

  // Add IMEI to blacklist (API key specific - adds to local blacklist for this API key)
  app.post("/api/v1/blacklist", validateApiKey, async (req, res) => {
    try {
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      const validated = publicBlacklistCreateSchema.parse(req.body);
      
      // Local blacklists are always API key specific
      if (validated.scope === "global") {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "Global blacklist management requires admin privileges. Use scope='local' for API key specific blacklists." 
        });
      }

      // Check if IMEI is already blacklisted for this API key
      const existing = await storage.isImeiBlacklisted(validated.imei, apiKeyId);
      if (existing && existing.apiKeyId === apiKeyId) {
        return res.status(409).json({ 
          error: "IMEI already blacklisted",
          message: "This IMEI is already in your blacklist",
          blacklist: {
            id: existing.id,
            imei: existing.imei,
            reason: existing.reason,
            blacklistedAt: existing.blacklistedAt
          }
        });
      }

      // Add to local blacklist
      const apiKey = await storage.getApiKeyById(apiKeyId);
      const blacklistedImei = await storage.addBlacklistedImei({
        imei: validated.imei,
        reason: validated.reason,
        apiKeyId: apiKeyId,
        addedBy: apiKey?.email || "api_user",
        isActive: true
      });

      res.status(201).json({
        success: true,
        scope: "local",
        message: "IMEI added to your local blacklist",
        blacklist: {
          id: blacklistedImei.id,
          imei: blacklistedImei.imei,
          reason: blacklistedImei.reason,
          apiKeyId: blacklistedImei.apiKeyId,
          blacklistedAt: blacklistedImei.blacklistedAt,
          addedBy: blacklistedImei.addedBy
        }
      });
    } catch (error) {
      console.error("Blacklist add error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ error: "Failed to add IMEI to blacklist" });
    }
  });

  // Remove IMEI from blacklist (API key specific - removes from local blacklist only)
  app.delete("/api/v1/blacklist/:imei", validateApiKey, async (req, res) => {
    try {
      const apiKeyId = (req as AuthenticatedRequest).apiKeyId;
      if (!apiKeyId) {
        return res.status(401).json({ error: "API key ID not found" });
      }

      const imei = req.params.imei;
      
      // Validate IMEI format
      if (!/^\d{15}$/.test(imei)) {
        return res.status(400).json({ 
          error: "Invalid IMEI", 
          message: "IMEI must be exactly 15 digits" 
        });
      }

      // Check if IMEI exists in this API key's blacklist
      const existing = await storage.isImeiBlacklisted(imei, apiKeyId);
      if (!existing || existing.apiKeyId !== apiKeyId) {
        return res.status(404).json({ 
          error: "IMEI not found in your blacklist",
          message: "This IMEI is not in your local blacklist"
        });
      }

      // Remove from local blacklist
      await storage.removeBlacklistedImei(imei, apiKeyId);

      res.json({
        success: true,
        scope: "local",
        message: "IMEI removed from your local blacklist",
        imei
      });
    } catch (error) {
      console.error("Blacklist remove error:", error);
      res.status(500).json({ error: "Failed to remove IMEI from blacklist" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/validate-email", async (req, res) => {
    try {
      const { email } = magicLinkRequestSchema.parse(req.body);

      // Check if email is a valid admin user
      const adminUser = await storage.getAdminUserByEmail(email);
      if (!adminUser) {
        return res.status(404).json({ 
          error: "Admin not found",
          message: "This email is not registered as an admin user." 
        });
      }

      res.json({ 
        success: true,
        message: "Admin email is valid",
        adminInfo: {
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role
        }
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

      // Verify email is a valid admin user
      const adminUser = await storage.getAdminUserByEmail(email);
      if (!adminUser) {
        return res.status(404).json({ 
          error: "Admin not found",
          message: "This email is not registered as an admin user." 
        });
      }

      // Update last login timestamp
      await storage.updateAdminLastLogin(email);

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

      // Capture session information
      const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown') as string;
      const userAgent = req.headers['user-agent'] || undefined;
      const referer = req.headers['referer'] || undefined;

      // Check if email is a valid admin user
      const adminUser = await storage.getAdminUserByEmail(email);
      const isExistingAdmin = !!adminUser;
      
      // Track access request for email campaigns
      let emailSent = false;
      
      if (!isExistingAdmin) {
        // Record the access request even for non-admin users
        await storage.createAdminAccessRequest({
          email,
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent,
          referer,
          isExistingAdmin: false,
          emailSent: false
        });
        
        return res.status(404).json({ 
          error: "Admin not found",
          message: "This email is not registered as an admin user." 
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

      // Create magic link
      const magicLink = `${req.protocol}://${req.get('host')}/admin?token=${token}`;
      
      // Send magic link via Resend email
      try {
        const { sendMagicLinkEmail } = await import('./services/resend.js');
        emailSent = await sendMagicLinkEmail({
          email,
          magicLink,
          appName: 'Device Insights Admin'
        });
        
        // Record the access request with email status
        await storage.createAdminAccessRequest({
          email,
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent,
          referer,
          isExistingAdmin: true,
          emailSent
        });
        
        if (emailSent) {
          console.log(`✅ Magic link email sent successfully to ${email}`);
          res.json({ 
            success: true,
            message: "Magic link sent to your email! Please check your inbox and click the link to login.",
            emailSent: true
          });
        } else {
          console.error(`❌ Failed to send magic link email to ${email}`);
          // Fallback to development mode
          console.log(`🔐 Development fallback - Magic link for ${email}: ${magicLink}`);
          res.json({ 
            success: true,
            message: "Email sending failed. Development link logged to console.",
            devNote: `Development mode: ${magicLink}`,
            isDevMode: true
          });
        }
      } catch (emailError) {
        console.error('Error sending magic link email:', emailError);
        
        // Record the access request even if email fails
        await storage.createAdminAccessRequest({
          email,
          ipAddress: ipAddress.split(',')[0].trim(),
          userAgent,
          referer,
          isExistingAdmin: true,
          emailSent: false
        });
        
        // Fallback to development mode
        console.log(`🔐 Development fallback - Magic link for ${email}: ${magicLink}`);
        res.json({ 
          success: true,
          message: "Email service unavailable. Development link logged to console.",
          devNote: `Development mode: ${magicLink}`,
          isDevMode: true
        });
      }
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

  // Firebase Messaging API Routes - Web Push Only (for website visitors)
  
  // Note: SMS and email messaging are now internal APIs only, not exposed publicly
  // They can only be used by server-side code for system notifications

  // Send web push notification to website visitors (requires API key)
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

  // === NPS (NET PROMOTER SCORE) ENDPOINTS ===

  // Submit NPS feedback (public endpoint)
  app.post("/api/nps/submit", async (req, res) => {
    try {
      const { searchId, rating, feedback } = req.body;

      // Validate rating is between 0-10
      if (typeof rating !== 'number' || rating < 0 || rating > 10) {
        return res.status(400).json({
          error: "Invalid rating",
          message: "Rating must be a number between 0 and 10"
        });
      }

      // Capture request metadata
      const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown') as string;
      const userAgent = req.headers['user-agent'] || undefined;

      const npsResponse = await storage.createNpsResponse({
        searchId: searchId || undefined,
        rating,
        feedback: feedback || undefined,
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent
      });

      res.json({
        success: true,
        message: "Thank you for your feedback!",
        response: {
          id: npsResponse.id,
          rating: npsResponse.rating
        }
      });
    } catch (error) {
      console.error("Submit NPS feedback error:", error);
      res.status(500).json({
        error: "Failed to submit feedback"
      });
    }
  });

  // Get overall statistics (admin only)
  app.get("/api/admin/stats", validateAdminSession, async (req, res) => {
    try {
      // Get overall system stats (not limited to specific API key)
      const allSearches = await storage.getImeiSearches(10000);
      const totalSearches = allSearches.length;
      
      // Calculate unique devices
      const uniqueDevices = new Set(
        allSearches
          .filter((s: any) => s.deviceMake && s.deviceModel)
          .map((s: any) => `${s.deviceMake}-${s.deviceModel}`)
      ).size;

      // Calculate success rate (searches with device info)
      const successfulSearches = allSearches.filter((s: any) => s.deviceMake && s.deviceModel).length;
      const successRate = totalSearches > 0 
        ? Math.round((successfulSearches / totalSearches) * 100) 
        : 0;

      // Get popular devices across all searches
      const deviceCounts: { [key: string]: { make: string; model: string; count: number } } = {};
      allSearches.forEach((search: any) => {
        if (search.deviceMake && search.deviceModel) {
          const key = `${search.deviceMake}-${search.deviceModel}`;
          if (!deviceCounts[key]) {
            deviceCounts[key] = {
              make: search.deviceMake,
              model: search.deviceModel,
              count: 0
            };
          }
          deviceCounts[key].count++;
        }
      });

      const popularDevices = Object.values(deviceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(device => ({
          name: `${device.make} ${device.model}`,
          manufacturer: device.make,
          searches: device.count
        }));

      res.json({
        totalSearches,
        uniqueDevices,
        successRate,
        apiCalls: totalSearches, // For consistency with the v1 API
        popularDevices
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({
        error: "Failed to fetch statistics"
      });
    }
  });

  // Helper function to normalize location strings (hide coordinates, normalize country names)
  function normalizeLocation(location: string | null | undefined): string {
    if (!location || location === 'unknown' || location === 'Unknown') {
      return 'Unknown Location';
    }

    // Check if location is GPS coordinates (pattern: number,number)
    const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (coordinatePattern.test(location.trim())) {
      // Hide raw coordinates for privacy
      return 'Location Not Specified';
    }

    // Normalize common location names
    const normalizedLocation = location.trim();
    
    // Country name normalization map
    const countryAliases: { [key: string]: string } = {
      'usa': 'United States',
      'us': 'United States',
      'united states of america': 'United States',
      'uk': 'United Kingdom',
      'britain': 'United Kingdom',
      'great britain': 'United Kingdom',
      'canada': 'Canada',
      'ca': 'Canada'
    };

    const lowerLocation = normalizedLocation.toLowerCase();
    if (countryAliases[lowerLocation]) {
      return countryAliases[lowerLocation];
    }

    // Capitalize first letter of each word for consistency
    return normalizedLocation
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Get location statistics with time filtering (admin only)
  app.get("/api/admin/location-stats", validateAdminSession, async (req, res) => {
    try {
      const period = req.query.period as string || '30d'; // 1h, 1d, 30d
      
      // Calculate time threshold
      const now = new Date();
      let timeThreshold = new Date();
      
      switch (period) {
        case '1h':
          timeThreshold.setHours(now.getHours() - 1);
          break;
        case '1d':
          timeThreshold.setDate(now.getDate() - 1);
          break;
        case '30d':
          timeThreshold.setDate(now.getDate() - 30);
          break;
        default:
          timeThreshold.setDate(now.getDate() - 30);
      }

      // Get searches within time period
      const allSearches = await storage.getImeiSearches(10000);
      const filteredSearches = allSearches.filter((search: any) => {
        const searchDate = new Date(search.searchedAt);
        return searchDate >= timeThreshold;
      });

      // Aggregate by normalized location (hide coordinates, group by country)
      const locationCounts: { [key: string]: number } = {};
      const locationCoordinates: { [key: string]: { lat: number; lng: number; count: number } } = {};
      
      filteredSearches.forEach((search: any) => {
        const normalizedLocation = normalizeLocation(search.searchLocation);
        locationCounts[normalizedLocation] = (locationCounts[normalizedLocation] || 0) + 1;
      });

      // Convert to array and sort
      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate total searches in period
      const totalSearches = filteredSearches.length;

      res.json({
        period,
        totalSearches,
        topLocations,
        locationCounts,
        heatmapData: topLocations.map(loc => ({
          name: loc.location,
          value: loc.count
        }))
      });
    } catch (error) {
      console.error("Location stats error:", error);
      res.status(500).json({
        error: "Failed to fetch location statistics"
      });
    }
  });

  // Get top API keys usage statistics (admin only)
  app.get("/api/admin/api-keys/top", validateAdminSession, async (req, res) => {
    try {
      const period = req.query.period as string || '30d';
      
      // Calculate time threshold
      const now = new Date();
      let timeThreshold = new Date();
      
      switch (period) {
        case '1h':
          timeThreshold.setHours(now.getHours() - 1);
          break;
        case '1d':
          timeThreshold.setDate(now.getDate() - 1);
          break;
        case '30d':
          timeThreshold.setDate(now.getDate() - 30);
          break;
        default:
          timeThreshold.setDate(now.getDate() - 30);
      }

      // Get all searches with API key info
      const allSearches = await storage.getImeiSearches(10000);
      
      // Filter by time period and aggregate by API key
      const apiKeyStats: { 
        [keyId: number]: { 
          email: string; 
          name: string; 
          requests: number;
          lastUsed?: Date;
        } 
      } = {};

      allSearches.forEach((search: any) => {
        const searchDate = new Date(search.searchedAt);
        if (searchDate >= timeThreshold && search.apiKeyId) {
          if (!apiKeyStats[search.apiKeyId]) {
            apiKeyStats[search.apiKeyId] = {
              email: 'Unknown',
              name: 'Unknown',
              requests: 0,
              lastUsed: searchDate
            };
          }
          apiKeyStats[search.apiKeyId].requests++;
          
          const currentLastUsed = apiKeyStats[search.apiKeyId].lastUsed;
          if (!currentLastUsed || searchDate > currentLastUsed) {
            apiKeyStats[search.apiKeyId].lastUsed = searchDate;
          }
        }
      });

      // Get API key details for each
      const apiKeyIds = Object.keys(apiKeyStats).map(id => parseInt(id));
      const apiKeyDetails: any[] = [];
      
      for (const keyId of apiKeyIds) {
        const apiKey = await storage.getApiKeyById(keyId);
        if (apiKey) {
          apiKeyStats[keyId].email = apiKey.email;
          apiKeyStats[keyId].name = apiKey.name;
        }
      }

      // Convert to array and sort by request count
      const topApiKeys = Object.entries(apiKeyStats)
        .map(([keyId, stats]) => ({
          apiKeyId: parseInt(keyId),
          email: stats.email,
          name: stats.name,
          requests: stats.requests,
          lastUsed: stats.lastUsed
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);

      res.json({
        period,
        topApiKeys,
        totalApiKeys: apiKeyIds.length
      });
    } catch (error) {
      console.error("Top API keys stats error:", error);
      res.status(500).json({
        error: "Failed to fetch API key statistics"
      });
    }
  });

  // Get NPS statistics (admin only)
  app.get("/api/admin/nps/stats", async (req, res) => {
    try {
      const stats = await storage.getNpsStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("Get NPS stats error:", error);
      res.status(500).json({
        error: "Failed to fetch NPS statistics"
      });
    }
  });

  // Get recent NPS responses (admin only)
  app.get("/api/admin/nps/responses", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const responses = await storage.getNpsResponses(limit);

      res.json({
        success: true,
        responses: responses.map(r => ({
          id: r.id,
          searchId: r.searchId,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt
        }))
      });
    } catch (error) {
      console.error("Get NPS responses error:", error);
      res.status(500).json({
        error: "Failed to fetch NPS responses"
      });
    }
  });

  // === NETWORK POLICY CMS ===

  // Get network policy (public)
  app.get("/api/network-policy", async (req, res) => {
    try {
      const policy = await storage.getNetworkPolicy();

      if (!policy) {
        // Return default policy if none exists
        return res.json({
          success: true,
          policy: {
            title: "Device Compatibility Policy",
            subtitle: "Download our comprehensive guide to ensure your device is compatible and unlocked before porting your number.",
            policyContent: {
              sectionTitle: "Device Compatibility Policy",
              sectionDescription: "Complete device compatibility guide and pre-porting checklist",
              documentTitle: "Complete Policy Document",
              documentDescription: "This comprehensive guide includes device unlock requirements, technical specifications, pre-porting checklist, and contact information to ensure a smooth transition onto this network.",
              includedItems: [
                "Device compatibility requirements and technical specifications",
                "Pre-porting checklist to avoid service interruptions",
                "Device unlock process and requirements",
                "Network band requirements and feature support",
                "Support contact information"
              ],
              footerText: "Policy version 2.0 | Updated January 2025 | Compatible with all devices"
            },
            version: "2.0"
          }
        });
      }

      res.json({
        success: true,
        policy
      });
    } catch (error) {
      console.error("Get network policy error:", error);
      res.status(500).json({
        error: "Failed to fetch network policy"
      });
    }
  });

  // Update network policy (admin only)
  app.put("/api/admin/network-policy", async (req, res) => {
    try {
      const { title, subtitle, policyContent, version, updatedBy } = req.body;

      const updatedPolicy = await storage.updateNetworkPolicy({
        title,
        subtitle,
        policyContent,
        version,
        updatedBy
      });

      res.json({
        success: true,
        policy: updatedPolicy
      });
    } catch (error) {
      console.error("Update network policy error:", error);
      res.status(500).json({
        error: "Failed to update network policy"
      });
    }
  });

  // === GITHUB UPLOAD TEST ===

  // Test GitHub integration and upload functionality
  app.post("/api/github/test", async (req, res) => {
    try {
      const { testGitHubUpload } = await import('./github-upload');
      const result = await testGitHubUpload();

      res.json({
        success: true,
        message: "GitHub integration test completed",
        result
      });
    } catch (error) {
      console.error("GitHub test error:", error);
      res.status(500).json({
        success: false,
        error: "GitHub test failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Upload README to GitHub
  app.post("/api/github/upload-readme", async (req, res) => {
    try {
      let { owner, repo } = req.body;

      // Get authenticated user if owner not provided
      if (!owner) {
        const { getUncachableGitHubClient } = await import('../github-client');
        const github = await getUncachableGitHubClient();
        const { data: user } = await github.rest.users.getAuthenticated();
        owner = user.login;
      }

      // Use correct repo name
      repo = repo || 'DeviceInsights';

      console.log(`GitHub README upload request: ${owner}/${repo}`);

      const { GitHubUploader } = await import('./github-upload');
      const uploader = new GitHubUploader({
        owner,
        repo,
        branch: 'main',
        commitMessage: `📚 Update README with 30+ languages support and ElevenLabs voice synthesis integration`,
        filesToUpload: ['README.md']
      });

      const result = await uploader.uploadFiles();

      console.log('GitHub README upload result:', result);
      res.json(result);
    } catch (error) {
      console.error("GitHub README upload error:", error);
      res.status(500).json({
        success: false,
        error: "GitHub README upload failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Perform actual GitHub upload with README
  app.post("/api/github/upload", async (req, res) => {
    try {
      const { owner, repo, commitMessage, filesToUpload } = req.body;

      if (!owner || !repo) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: owner and repo"
        });
      }

      console.log(`GitHub upload request: ${owner}/${repo}`);
      console.log(`Files to upload:`, filesToUpload || 'default files');

      const { GitHubUploader } = await import('./github-upload');
      const uploader = new GitHubUploader({
        owner,
        repo,
        branch: 'main',
        commitMessage: commitMessage || `🌍🎙️ Add 30+ Languages Support & ElevenLabs Voice Synthesis Integration - ${new Date().toLocaleDateString()}`,
        filesToUpload: filesToUpload || [
          'README.md',
          'package.json',
          'API_DOCUMENTATION.md', 
          'CONTRIBUTING.md',
          'LICENSE'
        ]
      });

      const result = await uploader.uploadFiles();

      console.log('GitHub upload result:', result);
      res.json(result);
    } catch (error) {
      console.error("GitHub upload error:", error);
      res.status(500).json({
        success: false,
        error: "GitHub upload failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // === ANALYTICS DEMO ENDPOINT ===

  // Demo analytics endpoint with aggregate insights and privacy-protected location data
  app.get("/api/analytics/demo", async (req, res) => {
    try {
      // Get aggregate statistics across all API keys
      const totalSearches = await storage.getTotalSearchCount();
      const totalUsers = await storage.getTotalUserCount();
      const totalApiKeys = await storage.getTotalApiKeyCount();

      // Get device type statistics
      const deviceTypes = await storage.getDeviceTypeStats();

      // Get location statistics (anonymized to city/state/country level)
      const locationStats = await storage.getLocationStatsAnonymized();

      // Get popular devices
      const popularDevices = await storage.getPopularDevices();

      // Get compatibility statistics
      const compatibilityStats = await storage.getCompatibilityStats();

      // Get API usage stats (without exposing sensitive data)
      const apiUsageStats = await storage.getApiUsageStatsPublic();

      // Get recent activity (sanitized)
      const recentActivity = await storage.getRecentActivitySanitized();

      res.json({
        success: true,
        data: {
          totalSearches,
          totalUsers,
          totalApiKeys,
          deviceTypes,
          locationStats,
          popularDevices,
          compatibilityStats,
          apiUsageStats,
          recentActivity
        }
      });
    } catch (error) {
      console.error("Analytics demo error:", error);
      res.status(500).json({
        error: "Failed to fetch analytics data"
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

  // === VOICE SERVICE ROUTES (ELEVENLABS INTEGRATION) ===

  // Get USSD instructions with voice (no API key required for public help)
  app.post("/api/voice/ussd-help", async (req, res) => {
    try {
      const { language, voiceCount } = req.body;

      const lang = language || 'en';
      const voices = parseInt(voiceCount) || 1;

      // Generate simple cache key based only on language and voice count (template-based)
      const cacheKey = storage.generateVoiceCacheKey(lang, voices, 'template');

      // Check cache first
      console.log(`[CACHE] Checking cache for key: ${cacheKey} (lang: ${lang}, voices: ${voices})`);
      const cacheStartTime = Date.now();
      const cachedAudio = await storage.getCachedVoiceAudio(cacheKey);
      const cacheCheckTime = Date.now() - cacheStartTime;

      if (cachedAudio) {
        const cacheAge = Math.floor((Date.now() - new Date(cachedAudio.cachedAt).getTime()) / 1000 / 60); // minutes
        const expiresIn = Math.floor((new Date(cachedAudio.expiresAt).getTime() - Date.now()) / 1000 / 60); // minutes

        console.log(`[CACHE HIT] ✅ Voice cache hit! Key: ${cacheKey}`);
        console.log(`[CACHE HIT] Cache age: ${cacheAge} minutes, expires in: ${expiresIn} minutes`);
        console.log(`[CACHE HIT] Cache lookup time: ${cacheCheckTime}ms`);
        console.log(`[CACHE HIT] Content type: ${cachedAudio.conversation ? 'multi-voice conversation' : 'single voice'}`);

        if (cachedAudio.conversation) {
          // Multi-voice cached result
          console.log(`[CACHE HIT] Returning ${cachedAudio.conversation.length} cached voice messages`);
          return res.json({
            success: true,
            conversation: cachedAudio.conversation,
            voiceCount: voices,
            isHarmonizing: voices >= 4,
            isSinging: voices >= 5,
            language: lang,
            cached: true
          });
        } else if (cachedAudio.singleAudio) {
          // Single voice cached result
          console.log(`[CACHE HIT] Returning cached single voice audio (${cachedAudio.singleAudio.audio.length} bytes)`);
          return res.json({
            success: true,
            text: cachedAudio.singleAudio.text,
            audio: cachedAudio.singleAudio.audio,
            voice: cachedAudio.singleAudio.voice,
            language: lang,
            cached: true
          });
        }
      }

      console.log(`[CACHE MISS] ❌ No cached audio found for key: ${cacheKey}`);
      console.log(`[CACHE MISS] Cache lookup time: ${cacheCheckTime}ms - proceeding with voice generation...`);
      console.log(`[CACHE MISS] Generating new template audio for: lang=${lang}, voices=${voices}`);

      // Get language-appropriate voices
      const languageVoices = await getVoicesForLanguage(lang);

      // Handle different voice styles (4 and 5 voices get special prompts)
      if (voices >= 4) {
        // Multi-voice conversation for harmonizing/singing (template-based)
        const conversation = createMultiVoiceConversation(
          "USSD Help", 
          voices,
          true, // isUSSDHelp flag for special prompts
          lang, // language parameter
          languageVoices // language-specific voices
        );

        // Generate audio for each message
        const audioPromises = conversation.map(async (message, index) => {
          try {
            const audioBuffer = await generateVoiceAudio(
              message.text, 
              message.voiceConfig,
              {
                stability: message.isHarmonizing ? 0.85 : 0.75,
                similarity_boost: message.isSinging ? 0.9 : 0.75,
                style: message.isSinging ? 0.8 : 0.5
              }
            );

            return {
              index,
              audio: Buffer.from(new Uint8Array(audioBuffer)).toString('base64'),
              message
            };
          } catch (error) {
            console.error(`Error generating audio for message ${index}:`, error);
            return null;
          }
        });

        const audioResults = await Promise.all(audioPromises);
        const validResults = audioResults.filter(result => result !== null);

        // Cache the multi-voice conversation result
        console.log(`[CACHE STORE] 💾 Storing multi-voice conversation template in cache`);
        console.log(`[CACHE STORE] Key: ${cacheKey}, Messages: ${validResults.length}, Lang: ${lang}, Voices: ${voices}`);
        const cacheStoreStart = Date.now();

        await storage.setCachedVoiceAudio(
          cacheKey,
          lang,
          voices,
          'template', // Simple template identifier
          validResults, // conversation
          undefined, // singleAudio
          24 * 30 // 30 days expiration for templates (reuse aggressively)
        );

        const cacheStoreTime = Date.now() - cacheStoreStart;
        console.log(`[CACHE STORE] ✅ Multi-voice conversation template cached successfully in ${cacheStoreTime}ms (30-day expiration)`);

        res.json({
          success: true,
          conversation: validResults,
          voiceCount: voices,
          isHarmonizing: voices >= 4,
          isSinging: voices >= 5,
          language: lang,
          cached: false
        });
      } else {
        // Single voice (1-3 voices) - standard USSD instructions (template-based)
        const finalText = getUSSDInstructions(lang);

        // Get language-appropriate voices if not already fetched
        const selectedVoice = languageVoices[0];
        const audioBuffer = await generateVoiceAudio(finalText, selectedVoice);
        const audioBase64 = Buffer.from(new Uint8Array(audioBuffer)).toString('base64');

        // Cache the single-voice result
        console.log(`[CACHE STORE] 💾 Storing single voice audio template in cache`);
        console.log(`[CACHE STORE] Key: ${cacheKey}, Audio size: ${audioBase64.length} bytes, Lang: ${lang}`);
        const cacheStoreStart = Date.now();

        await storage.setCachedVoiceAudio(
          cacheKey,
          lang,
          voices,
          'template', // Simple template identifier
          undefined, // conversation
          {
            audio: audioBase64,
            text: finalText,
            voice: selectedVoice
          }, // singleAudio
          24 * 30 // 30 days expiration for templates (reuse aggressively)
        );

        const cacheStoreTime = Date.now() - cacheStoreStart;
        console.log(`[CACHE STORE] ✅ Single voice audio template cached successfully in ${cacheStoreTime}ms (30-day expiration)`);

        res.json({
          success: true,
          text: finalText,
          audio: audioBase64,
          voice: selectedVoice,
          language: lang,
          cached: false
        });
      }

    } catch (error) {
      console.error("USSD help error:", error);
      res.status(500).json({
        error: "USSD help failed",
        message: "Unable to generate USSD voice instructions"
      });
    }
  });

  // Get available languages (no API key required)
  app.get("/api/voice/languages", async (req, res) => {
    try {
      res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES,
        total: Object.keys(SUPPORTED_LANGUAGES).length
      });
    } catch (error) {
      console.error("Languages fetch error:", error);
      res.status(500).json({
        error: "Languages fetch failed",
        message: "Unable to fetch supported languages"
      });
    }
  });

  // Get available voice agents (no API key required)
  app.get("/api/voice/agents", async (req, res) => {
    try {
      const { language } = req.query;
      const lang = typeof language === 'string' ? language : 'en';

      const voices = await getVoicesForLanguage(lang);

      res.json({
        success: true,
        agents: voices,
        default_agents: DEFAULT_VOICE_AGENTS,
        language: lang
      });
    } catch (error) {
      console.error("Voice agents fetch error:", error);
      res.status(500).json({
        error: "Voice agents fetch failed",
        message: "Unable to fetch voice agents"
      });
    }
  });

  // Create multi-voice conversation (no API key required for demo)
  app.post("/api/voice/multi-conversation", async (req, res) => {
    try {
      const { text, voiceCount, location, language } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          error: "Invalid text",
          message: "Text is required and must be a string"
        });
      }

      const count = Math.max(1, Math.min(5, parseInt(voiceCount) || 1));

      const conversation = createMultiVoiceConversation(text, count, false, language);

      // Generate audio for each message in the conversation
      const audioPromises = conversation.map(async (message, index) => {
        try {
          const audioBuffer = await generateVoiceAudio(
            message.text, 
            message.voiceConfig,
            {
              stability: message.isHarmonizing ? 0.85 : 0.75,
              similarity_boost: message.isSinging ? 0.9 : 0.75,
              style: message.isSinging ? 0.8 : 0.5
            }
          );

          return {
            index,
            audio: Buffer.from(new Uint8Array(audioBuffer)).toString('base64'),
            message
          };
        } catch (error) {
          console.error(`Error generating audio for message ${index}:`, error);
          return null;
        }
      });

      const audioResults = await Promise.all(audioPromises);
      const validResults = audioResults.filter(result => result !== null);

      res.json({
        success: true,
        conversation: validResults,
        voiceCount: count,
        isHarmonizing: count >= 4,
        isSinging: count >= 5
      });

    } catch (error) {
      console.error("Multi-voice conversation error:", error);
      res.status(500).json({
        error: "Conversation generation failed",
        message: "Unable to create multi-voice conversation"
      });
    }
  });

  // MVNO Configuration endpoint (public, no authentication required)
  app.get("/api/mvno-config", (req, res) => {
    res.json({
      name: MVNO.name,
      companyName: MVNO.companyName,
      website: MVNO.website,
      phone: MVNO.phone,
      supportEmail: MVNO.supportEmail,
      internationalCarrier: MVNO.internationalCarrier
    });
  });

  // Register PDF generation routes
  registerPDFRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}