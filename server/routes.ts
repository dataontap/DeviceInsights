import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { analyzeIMEI, validateIMEI } from "./services/gemini";
import { insertImeiSearchSchema, insertPolicyAcceptanceSchema } from "@shared/schema";
import { z } from "zod";

// Simple API key validation middleware
function validateApiKey(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '');
  
  // For demo purposes, accept any non-empty API key
  // In production, you should validate against your API key database
  if (!apiKey || apiKey.trim() === '') {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Store API key for logging/analytics
  req.apiKey = apiKey;
  next();
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

  // Add CORS headers for API access
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
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
        "GET /api/v1/stats": "Get usage statistics",
        "GET /api/v1/export": "Export search data",
        "GET /api/v1/search/{id}": "Get individual search details",
        "GET /api/v1/admin/searches": "Get detailed admin search data"
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

        res.json({
          success: true,
          searchId: search.id,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            imei: imei
          },
          networkCompatibility: deviceInfo.networkCapabilities,
          analysis: "Device analysis completed",
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

      // Get client IP and user agent for analytics
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      try {
        // Analyze device using AI with specified network (default AT&T)
        const targetNetwork = network || "AT&T";
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

        res.json({
          success: true,
          device: {
            make: deviceInfo.make,
            model: deviceInfo.model,
            year: deviceInfo.year,
            modelNumber: deviceInfo.modelNumber,
            imei: imei
          },
          capabilities: deviceInfo.networkCapabilities,
          specifications: deviceInfo.specifications,
          searchId: search.id
        });
      } catch (aiError) {
        console.error("AI Analysis error:", aiError);
        
        // Store failed search
        await storage.createImeiSearch({
          imei,
          searchLocation: location || 'unknown',
          ipAddress,
          userAgent,
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

  // Get search statistics
  app.get("/api/v1/stats", async (req, res) => {
    try {
      const stats = await storage.getSearchStatistics();
      const popularDevices = await storage.getPopularDevices(5);
      const locationData = await storage.getSearchesByLocation();
      
      res.json({
        totalSearches: stats.totalSearches,
        uniqueDevices: stats.uniqueDevices,
        successRate: stats.successRate,
        apiCalls: stats.totalSearches, // For now, same as total searches
        popularDevices: popularDevices.map(device => ({
          name: `${device.deviceMake} ${device.deviceModel}`,
          manufacturer: device.deviceMake,
          searches: device.searchCount
        })),
        locations: locationData.map(loc => ({
          location: loc.location,
          searches: loc.searchCount
        }))
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Export search data (requires API key)
  app.get("/api/v1/export", validateApiKey, async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const searches = await storage.getImeiSearches(1000);
      
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
        res.setHeader('Content-Disposition', 'attachment; filename=imei_searches.csv');
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
          }))
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Get individual search by ID (requires API key)
  app.get("/api/v1/search/:id", validateApiKey, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getImeiSearchById(id);
      
      if (!search) {
        return res.status(404).json({ error: "Search not found" });
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

  // Get detailed searches with location data for admin (requires API key)
  app.get("/api/v1/admin/searches", validateApiKey, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const searches = await storage.getImeiSearches(limit);
      
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
        }))
      });
    } catch (error) {
      console.error("Admin searches error:", error);
      res.status(500).json({ error: "Failed to fetch searches" });
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

  const httpServer = createServer(app);
  return httpServer;
}
