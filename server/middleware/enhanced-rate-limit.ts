import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

interface AuthenticatedRequest extends Request {
  apiKeyId?: number;
  apiKeyName?: string;
  startTime?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Enhanced rate limiter that tracks usage per API key
export function createEnhancedRateLimit(config: RateLimitConfig) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    req.startTime = startTime;

    const apiKeyId = req.apiKeyId;
    const endpoint = req.path;
    const method = req.method;
    const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!apiKeyId) {
      // For unauthenticated requests, fall back to IP-based limiting
      return next();
    }

    try {
      // Check current usage count for this API key
      const usageCount = await storage.getApiUsageCount(apiKeyId, config.windowMs / (1000 * 60 * 60));
      
      let rateLimitExceeded = false;
      if (usageCount >= config.maxRequests) {
        rateLimitExceeded = true;
        
        // Record the rate limit violation
        await storage.recordApiUsage({
          apiKeyId,
          endpoint,
          method,
          ipAddress,
          userAgent,
          responseStatus: 429,
          responseTime: Date.now() - startTime,
          rateLimitExceeded: true,
          requestSize: parseInt(req.headers['content-length'] as string) || 0,
          responseSize: 0
        });

        // Create admin notification for rate limit violation
        await storage.createAdminNotification({
          type: "rate_limit_exceeded",
          title: "Rate Limit Exceeded",
          message: `API key ${req.apiKeyName || 'Unknown'} has exceeded rate limits on ${endpoint}`,
          severity: "warning",
          apiKeyId,
          metadata: {
            endpoint,
            requestCount: usageCount,
            timeWindow: `${config.windowMs / (1000 * 60)} minutes`,
            ipAddress,
            userAgent
          }
        });

        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `You have exceeded the rate limit of ${config.maxRequests} requests per ${config.windowMs / (1000 * 60)} minutes.`,
          details: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            usage: usageCount,
            resetTime: new Date(Date.now() + (config.windowMs - (Date.now() % config.windowMs))).toISOString()
          },
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }

      // Add response tracking
      const originalSend = res.send;
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        const responseSize = Buffer.byteLength(data || '', 'utf8');

        // Record API usage asynchronously
        setImmediate(async () => {
          try {
            await storage.recordApiUsage({
              apiKeyId: apiKeyId!,
              endpoint,
              method,
              ipAddress,
              userAgent,
              responseStatus: res.statusCode,
              responseTime,
              rateLimitExceeded: false,
              requestSize: parseInt(req.headers['content-length'] as string) || 0,
              responseSize
            });

            // Check for potential abuse patterns
            if (res.statusCode >= 400) {
              const recentErrors = await storage.getApiUsageByKey(apiKeyId!, 1);
              const errorCount = recentErrors.filter(usage => usage.responseStatus && usage.responseStatus >= 400).length;
              
              if (errorCount > 50) { // More than 50 errors in the last hour
                await storage.createAdminNotification({
                  type: "api_abuse",
                  title: "Potential API Abuse Detected",
                  message: `API key ${req.apiKeyName || 'Unknown'} has generated ${errorCount} errors in the last hour`,
                  severity: "error",
                  apiKeyId: apiKeyId!,
                  metadata: {
                    endpoint,
                    requestCount: errorCount,
                    timeWindow: "1 hour",
                    ipAddress,
                    userAgent
                  }
                });
              }
            }
          } catch (error) {
            console.error('Failed to record API usage:', error);
          }
        });

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Enhanced rate limiting error:', error);
      next(); // Continue on error, don't block the request
    }
  };
}

// MCP-specific rate limiting for automated services
export const mcpRateLimit = createEnhancedRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 500, // Higher limit for MCP servers
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Standard rate limiting for regular API usage
export const standardRateLimit = createEnhancedRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // Standard limit
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Premium rate limiting for upgraded accounts
export const premiumRateLimit = createEnhancedRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000, // Premium limit
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});