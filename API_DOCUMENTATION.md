# IMEI Device Checker API Documentation

## Privacy & Data Collection

### Network Connectivity Monitoring
Every time you use our IMEI checking service, we automatically perform network connectivity pings to measure your current network performance and compatibility. This helps us provide accurate device analysis and network recommendations. **No other private information is collected during these pings.**

### Location Services (Optional)
Location data is only collected with your **explicit consent** when you choose to enable location-based features. This enhanced service provides:
- Regional network analysis and coverage maps
- Real-time provider comparisons for your location  
- Personalized recommendations based on your geographic area

### Your Privacy Rights
- Location services are completely optional
- You can request deletion of all collected data at any time by contacting support@dotm.com
- Location services can be disabled in your browser settings
- We respect your privacy choices and make data control easy

---

## Base URL
```
https://your-replit-app.replit.app
```

## Authentication
All API endpoints require an API key to be included in the request headers:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Check Device Compatibility
**POST** `/api/v1/check`

Analyze an IMEI number and return device information with network compatibility.

#### Request Body
```json
{
  "imei": "123456789012345",
  "location": "37.7749,-122.4194",
  "network": "DOTM"
}
```

#### Parameters
- `imei` (string, required): 15-digit IMEI number
- `location` (string, optional): GPS coordinates or location name
- `network` (string, optional): Target network name (defaults to "AT&T")

#### Response
```json
{
  "success": true,
  "device": {
    "make": "Google",
    "model": "Pixel 8 Pro",
    "year": 2023,
    "modelNumber": "GC3VE",
    "imei": "123456789012345"
  },
  "capabilities": {
    "fourG": true,
    "fiveG": true,
    "volte": true,
    "wifiCalling": "supported"
  },
  "specifications": {
    "networkBands": "LTE: B1, B2, B3...",
    "releaseYear": 2023
  },
  "searchId": 123
}
```

### 2. Get Analytics Statistics
**GET** `/api/v1/stats`

Retrieve platform usage statistics and analytics.

#### Response
```json
{
  "totalSearches": 1500,
  "uniqueDevices": 245,
  "successRate": 92.5,
  "apiCalls": 1500,
  "popularDevices": [
    {
      "name": "iPhone 14 Pro",
      "manufacturer": "Apple",
      "searches": 125
    }
  ],
  "locations": [
    {
      "location": "San Francisco, CA",
      "searches": 89
    }
  ]
}
```

### 3. Export Data
**GET** `/api/v1/export?format=json&limit=100`

Export search data in JSON or CSV format.

#### Query Parameters
- `format` (string): "json" or "csv"
- `limit` (number): Maximum records to return (default: 100)

#### Response (JSON)
```json
{
  "data": [
    {
      "id": 1,
      "imei": "123456789012345",
      "device": "Google Pixel 8 Pro",
      "searchedAt": "2024-01-20T10:30:00Z",
      "location": "San Francisco, CA"
    }
  ]
}
```

### 4. Get Individual Search
**GET** `/api/v1/search/{id}`

Retrieve details for a specific search by ID.

#### Response
```json
{
  "id": 123,
  "imei": "123456789012345",
  "device": {
    "make": "Google",
    "model": "Pixel 8 Pro",
    "year": 2023
  },
  "capabilities": {
    "fourG": true,
    "fiveG": true,
    "volte": true,
    "wifiCalling": "supported"
  },
  "location": "37.7749,-122.4194",
  "searchedAt": "2024-01-20T10:30:00Z"
}
```

### 5. Admin Searches (Requires Admin Access)
**GET** `/api/v1/admin/searches?limit=50`

Get detailed search data with coordinates for administrative purposes.

#### Query Parameters
- `limit` (number): Maximum records to return (default: 50)

#### Response
```json
{
  "searches": [
    {
      "id": 1,
      "imei": "123456789012345",
      "device": {
        "make": "Google",
        "model": "Pixel 8 Pro",
        "year": 2023
      },
      "location": "37.7749,-122.4194",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      },
      "searchedAt": "2024-01-20T10:30:00Z",
      "ipAddress": "192.168.1.1"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid IMEI format"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "error": "Search not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to analyze IMEI"
}
```

## Rate Limits
- 1000 requests per hour per API key
- 10 requests per minute for device analysis endpoint

## Network Compatibility
The system provides compatibility analysis for major US carriers:
- **4G LTE**: Full band compatibility analysis
- **5G**: Sub-6 and mmWave support detection
- **VoLTE**: Voice over LTE capability
- **Wi-Fi Calling**: Carrier-specific support levels

## Supported Device Types
- iPhones (Apple)
- Android smartphones (Samsung, Google, OnePlus, etc.)
- Basic phones with LTE capability
- IoT devices with cellular connectivity

## Getting an API Key
Contact the administrator to obtain an API key for external service integration.

## SDK and Code Examples

### cURL Example
```bash
curl -X POST https://your-app.replit.app/api/v1/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "imei": "123456789012345",
    "location": "San Francisco, CA"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('https://your-app.replit.app/api/v1/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    imei: '123456789012345',
    location: 'San Francisco, CA'
  })
});

const data = await response.json();
console.log(data);
```

### Python Example
```python
import requests

response = requests.post(
    'https://your-app.replit.app/api/v1/check',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'imei': '123456789012345',
        'location': 'San Francisco, CA'
    }
)

data = response.json()
print(data)
```

---

# Coverage Maps API

## Overview
The Coverage Maps API provides comprehensive network coverage analysis for mobile carriers and broadband providers using AI-powered analysis of network issue reports.

## Coverage Analysis Endpoints

### 6. Analyze Network Coverage
**POST** `/api/coverage/analyze`

Analyzes network coverage for mobile carriers and broadband providers at a specific location.

#### Request Body
```json
{
  "lat": 43.6532,
  "lng": -79.3832,
  "address": "Toronto, ON, Canada",
  "provider": "Rogers"
}
```

#### Parameters
- `lat` (number, required): Latitude coordinate (-90 to 90)
- `lng` (number, required): Longitude coordinate (-180 to 180)
- `address` (string, optional): Human-readable address for context
- `provider` (string, optional): Specific provider to analyze ("auto" for country defaults)

#### Supported Providers
**Mobile Carriers:** Verizon, AT&T, T-Mobile (US), Rogers, Bell, Telus (Canada), DOTM (International)
**Broadband Providers:** Comcast, Spectrum, Verizon Fios, AT&T Internet (US), Rogers Internet, Bell Internet, Telus Internet (Canada)

#### Response
```json
{
  "success": true,
  "data": {
    "location": {
      "lat": 43.6532,
      "lng": -79.3832,
      "address": "Toronto, ON, Canada"
    },
    "mobile_providers": [
      {
        "provider": "Rogers",
        "service_type": "mobile",
        "coverage_score": 95,
        "reliability_rating": 5,
        "recent_issues": 0,
        "issue_summary": "No mobile service issues reported in the last 30 days",
        "recommendation": "excellent",
        "confidence_score": 0.95,
        "last_major_outage": "None reported in the last 30 days"
      }
    ],
    "broadband_providers": [
      {
        "provider": "Bell Internet",
        "service_type": "broadband",
        "coverage_score": 88,
        "reliability_rating": 4,
        "recent_issues": 1,
        "issue_summary": "Minor connectivity issues reported by few users",
        "recommendation": "good",
        "confidence_score": 0.87,
        "last_major_outage": "2025-06-15T10:30:00Z"
      }
    ],
    "analysis_timestamp": "2025-01-30T08:35:42Z",
    "data_period": "Last 30 days"
  }
}
```

### 7. Report Network Issue
**POST** `/api/coverage/analyze-issue`

Reports a network issue and analyzes similar problems in the area using AI pattern recognition.

#### Request Body
```json
{
  "lat": 43.6532,
  "lng": -79.3832,
  "address": "Toronto, ON, Canada",
  "issue_description": "Frequent call drops during peak hours",
  "user_agent": "Mozilla/5.0..."
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "issue_analysis": "AI analysis of your reported issue...",
    "similar_issues_summary": "3 similar issues found in your area",
    "device_pattern": "Pattern detected with Samsung Galaxy devices",
    "recommendations": "Try switching to 4G mode during peak hours",
    "confidence_score": 0.85,
    "similar_reports": [
      {
        "device": "Samsung Galaxy S21",
        "description": "Call drops on Rogers network",
        "distance": "1.2km away"
      }
    ]
  }
}
```

## Coverage Maps Features

### AI Analysis
- **Pattern Recognition**: Identifies similar issues by device type and location
- **Confidence Scoring**: 0.9-1.0 (high confidence) to 0.0-0.5 (low confidence)
- **Device-Specific Analysis**: Provides device-specific recommendations
- **Historical Trends**: Analyzes patterns and trends over time

### Geographic Coverage
- **Automatic Provider Detection**: Detects largest providers by country
- **Coordinate Boundaries**: US, Canada, and global coverage
- **10km Radius Analysis**: Comprehensive area coverage analysis
- **Google Maps Integration**: Static map thumbnails with coverage visualization

### Performance Optimization
- **Caching**: 30-minute response caching for improved performance
- **Rate Limiting**: 100 requests per hour per IP address
- **Real-time Analysis**: Live network issue data processing

## Support

For technical support or API questions:
- Email: rbm@dotmobile.app first with questions
- Documentation: Visit `/coverage-maps` for interactive testing
- Status: Monitor API health at your deployment URL

---

*Coverage Maps API is currently in Alpha status. Results are experimental and should be verified with additional sources for critical decisions.*