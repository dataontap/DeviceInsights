import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeIMEI, validateIMEI } from "./services/gemini";
import { insertImeiSearchSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // IMEI Analysis endpoint
  app.post("/api/v1/check", async (req, res) => {
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

  // Export search data
  app.get("/api/v1/export", async (req, res) => {
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

  // Get individual search by ID
  app.get("/api/v1/search/:id", async (req, res) => {
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

  // Get detailed searches with location data for admin
  app.get("/api/v1/admin/searches", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
