# DOTM Device Compatibility API

A comprehensive IMEI device checker and network connectivity monitoring platform with AI-powered device identification, lightweight speed analytics, and automated email insights.

## 🚀 Features

- **AI-Powered IMEI Analysis** - Device identification using Google Gemini with intelligent fallback
- **Network Connectivity Monitoring** - Lightweight speed analytics and interruption detection
- **Monthly Email Insights** - Automated connectivity reports for registered users
- **Real-time Alerts** - Connectivity issue notifications through web app
- **MCP Server Integration** - Optimized for automated LLM services
- **Admin Portal** - Comprehensive usage tracking and rate limit monitoring

## 📊 Service Tiers & Rate Limits

### Standard Tier
- **Rate Limit**: 100 requests per hour
- **Use Case**: Individual developers, small projects
- **Features**: Basic IMEI analysis, connectivity monitoring

### MCP Server Tier
- **Rate Limit**: 500 requests per hour
- **Use Case**: Model Context Protocol servers and automated LLM services
- **Features**: Enhanced rate limits, optimized for AI workflows

### Premium Tier
- **Rate Limit**: 1000 requests per hour
- **Use Case**: Production applications, high-volume services
- **Features**: Priority support, advanced analytics

## 🤖 MCP Server Integration

The DOTM API is optimized for **Model Context Protocol (MCP)** servers, providing AI assistants with reliable device compatibility data and connectivity insights.

### Why Use DOTM with MCP?

- **AI-Optimized Responses**: Structured JSON responses perfect for LLM processing
- **Intelligent Rate Limiting**: Higher limits (500/hour) for automated services
- **Comprehensive Data**: Device specs, network compatibility, and connectivity insights
- **Real-time Monitoring**: Track API usage and performance through admin portal

### MCP Server Setup

#### 1. Register for MCP API Key

Contact our support team for MCP-tier API access:

```bash
# Request MCP API key
curl -X POST https://your-domain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"type": "mcp_access", "email": "your-email@domain.com", "service": "Your MCP Server Name"}'
```

#### 2. Configure Your MCP Server

```python
# Example MCP server configuration
import requests
import json
from datetime import datetime, timedelta

class DOTMConnector:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://your-domain.com/api/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "MCP-DOTM-Connector/1.0"
        }
        self.request_count = 0
        self.last_reset = datetime.now()
    
    def check_rate_limit(self):
        """Monitor rate limit usage"""
        if datetime.now() - self.last_reset > timedelta(hours=1):
            self.request_count = 0
            self.last_reset = datetime.now()
        
        if self.request_count >= 480:  # Leave buffer for 500 limit
            raise Exception("Approaching rate limit. Please wait.")
    
    def analyze_device(self, imei: str, location: str = None) -> dict:
        """Analyze IMEI device for MCP server"""
        self.check_rate_limit()
        
        payload = {
            "imei": imei,
            "location": location or "Unknown",
            "accept_policy": True
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/check",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            self.request_count += 1
            
            if response.status_code == 429:
                # Rate limit exceeded
                return {
                    "error": "rate_limit_exceeded",
                    "message": "MCP service rate limit exceeded",
                    "retry_after": response.headers.get("Retry-After", "3600")
                }
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {
                "error": "api_error",
                "message": str(e),
                "imei": imei
            }
    
    def get_usage_stats(self) -> dict:
        """Get API usage statistics"""
        try:
            response = requests.get(
                f"{self.base_url}/stats",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

# Usage in your MCP server
dotm = DOTMConnector("your_mcp_api_key_here")

def handle_device_query(imei: str, location: str = None):
    """Handle device compatibility query from LLM"""
    result = dotm.analyze_device(imei, location)
    
    if "error" in result:
        if result["error"] == "rate_limit_exceeded":
            return f"Rate limit reached. Service will resume in {result.get('retry_after', 3600)} seconds."
        return f"Analysis failed: {result['message']}"
    
    # Format response for LLM
    device_info = result.get("device", {})
    compatibility = result.get("compatibility", {})
    
    return f\"\"\"
Device Analysis Results:
- Device: {device_info.get('make')} {device_info.get('model')} ({device_info.get('year', 'Unknown')})
- DOTM Compatible: {'Yes' if compatibility.get('dotm') else 'No'}
- 5G Support: {'Yes' if compatibility.get('fiveG') else 'No'}
- VoLTE: {'Yes' if compatibility.get('volte') else 'No'}
- Network Quality Score: {result.get('qualityScore', 'N/A')}/100
\"\"\"
```

#### 3. JavaScript/TypeScript MCP Integration

```typescript
interface DOTMConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimitBuffer?: number;
}

class DOTMMCPClient {
  private config: DOTMConfig;
  private requestCount = 0;
  private resetTime = Date.now() + (60 * 60 * 1000);

  constructor(config: DOTMConfig) {
    this.config = {
      baseUrl: 'https://your-domain.com/api/v1',
      rateLimitBuffer: 20, // Buffer of 20 requests
      ...config
    };
  }

  async checkDevice(imei: string, location?: string): Promise<any> {
    // Rate limit check
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + (60 * 60 * 1000);
    }

    if (this.requestCount >= (500 - this.config.rateLimitBuffer!)) {
      throw new Error(`MCP rate limit buffer reached. Reset at: ${new Date(this.resetTime).toISOString()}`);
    }

    const response = await fetch(`${this.config.baseUrl}/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-DOTM-Client/1.0'
      },
      body: JSON.stringify({
        imei,
        location: location || 'Unknown',
        accept_policy: true
      })
    });

    this.requestCount++;

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '3600';
      throw new Error(`Rate limit exceeded. Retry after: ${retryAfter} seconds`);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUsageStats(): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/stats`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    return response.json();
  }
}
```

## 📈 Rate Limit Monitoring & Notifications

### Rate Limit Headers
All API responses include rate limit information:

```
RateLimit-Limit: 500
RateLimit-Remaining: 487
RateLimit-Reset: 1640995200
RateLimit-Policy: 500;w=3600
```

### Rate Limit Exceeded Response
When limits are exceeded, you'll receive:

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 500 requests per 60 minutes.",
  "details": {
    "limit": 500,
    "windowMs": 3600000,
    "usage": 501,
    "resetTime": "2024-01-01T15:00:00.000Z"
  },
  "retryAfter": 3600
}
```

### Admin Notifications
Rate limit violations automatically generate admin notifications:

```json
{
  "type": "rate_limit_exceeded",
  "title": "Rate Limit Exceeded",
  "message": "API key 'MCP-Server-Production' has exceeded rate limits on /api/v1/check",
  "severity": "warning",
  "metadata": {
    "endpoint": "/api/v1/check",
    "requestCount": 501,
    "timeWindow": "60 minutes",
    "ipAddress": "192.168.1.100",
    "userAgent": "MCP-DOTM-Connector/1.0"
  }
}
```

## 🔧 API Endpoints

### Device Analysis
```http
POST /api/v1/check
Authorization: Bearer your_api_key

{
  "imei": "123456789012345",
  "location": "New York, NY",
  "accept_policy": true
}
```

### User Registration (for email insights)
```http
POST /api/users/register

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "emailPreferences": {
    "monthlyInsights": true,
    "interruptionAlerts": true,
    "speedAlerts": true
  }
}
```

### Connectivity Monitoring
```http
POST /api/connectivity/record
X-User-Email: user@example.com

{
  "sessionId": "unique-session-id",
  "downloadSpeed": 25000,
  "uploadSpeed": 5000,
  "latency": 45,
  "connectionType": "4G",
  "carrier": "DOTM"
}
```

### Usage Statistics
```http
GET /api/v1/stats
Authorization: Bearer your_api_key
```

## 🔐 Admin Portal Access

### Request Admin Access

To access the admin portal for monitoring API usage, rate limits, and generating reports:

#### Email Request
Send an email to: **admin-access@dotm.com**

**Subject**: Admin Portal Access Request

**Required Information**:
```
Company/Organization: [Your Organization]
Email Address: [Your Email]
API Key Name: [Your API Key Name]
Use Case: [Brief description of your use case]
Expected Monthly Volume: [Estimated requests per month]
Technical Contact: [Primary technical contact]
Billing Contact: [Billing/business contact]
```

#### Online Request Form
Visit: **https://your-domain.com/admin-request**

Fill out the admin access request form with:
- Organization details
- Technical requirements
- Usage expectations
- Billing information

#### API Request
```http
POST /api/admin/access-request
Content-Type: application/json

{
  "organization": "Your Company",
  "email": "admin@yourcompany.com",
  "apiKeyName": "your-api-key-name",
  "useCase": "Production IMEI analysis for mobile app",
  "monthlyVolume": 50000,
  "technicalContact": {
    "name": "John Doe",
    "email": "john@yourcompany.com",
    "role": "Lead Developer"
  },
  "billingContact": {
    "name": "Jane Smith",
    "email": "billing@yourcompany.com",
    "role": "Finance Manager"
  }
}
```

### Admin Portal Features

Once approved, you'll have access to:

#### Dashboard
- **Real-time Usage Metrics**: Current request rates, response times
- **Rate Limit Status**: Usage vs. limits, time until reset
- **Error Tracking**: Failed requests, rate limit violations
- **Performance Analytics**: Average response times, success rates

#### API Key Management
- **Usage History**: Detailed request logs and statistics
- **Rate Limit Configuration**: Adjust limits based on tier
- **Key Regeneration**: Rotate API keys securely
- **Usage Alerts**: Set up notifications for usage thresholds

#### Reporting
- **Monthly Reports**: Detailed usage and performance reports
- **Custom Analytics**: Filter by date range, endpoint, response codes
- **Export Data**: CSV/JSON export of usage statistics
- **Billing Reports**: Usage-based billing calculations

#### Notifications
- **Rate Limit Alerts**: Real-time notifications when approaching limits
- **Error Threshold Alerts**: Notifications for high error rates
- **System Notifications**: API updates, maintenance windows
- **Custom Alerts**: Configure custom notification rules

### Response Timeline
- **Email Requests**: 2-3 business days
- **Online Form**: 1-2 business days  
- **API Requests**: Immediate confirmation, 1 business day approval
- **Urgent Requests**: Contact support@dotm.com with "URGENT" in subject

### Admin Portal URL
After approval: **https://your-domain.com/admin**

Login credentials will be sent to your registered email address.

## 🛡️ Security & Best Practices

### API Key Security
- Store API keys in environment variables, never in code
- Use different keys for development, staging, and production
- Rotate keys regularly (recommended: every 90 days)
- Monitor usage for unusual patterns

### Rate Limit Best Practices
- Implement client-side rate limiting with buffers
- Cache responses when appropriate
- Use exponential backoff for retries
- Monitor usage through admin portal

### Error Handling
Always handle rate limit responses gracefully:

```javascript
async function makeAPICall(endpoint, data) {
  try {
    const response = await fetch(endpoint, { /* config */ });
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`Rate limited. Retry after: ${retryAfter} seconds`);
      // Implement retry logic with exponential backoff
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}
```

## 📞 Support & Contact

### Technical Support
- **Email**: support@dotm.com
- **Documentation**: https://your-domain.com/docs
- **API Status**: https://status.dotm.com

### Business Inquiries
- **Sales**: sales@dotm.com
- **Partnerships**: partners@dotm.com
- **Admin Access**: admin-access@dotm.com

### Emergency Contact
For critical issues affecting production services:
- **Emergency Support**: urgent@dotm.com
- **Subject Line**: CRITICAL - [Brief Description]

---

## 📄 License & Terms

This API is provided under commercial license. By using this service, you agree to our Terms of Service and Privacy Policy.

- **Terms of Service**: https://your-domain.com/terms
- **Privacy Policy**: https://your-domain.com/privacy
- **SLA**: https://your-domain.com/sla

---

*Last Updated: January 2024*
*API Version: 1.0.0*
*Documentation Version: 1.0.0*