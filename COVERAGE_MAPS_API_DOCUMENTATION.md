# Coverage Maps API Documentation

## Overview

The Coverage Maps API provides comprehensive network coverage analysis for mobile carriers and broadband providers. Using AI-powered analysis of network issue reports, the API delivers real-time coverage scores, reliability ratings, and detailed issue summaries for any geographic location.

## Base URL
```
https://api.deviceinsights.net
```

## Authentication

All coverage maps endpoints require API key authentication using Bearer token format:

```
Authorization: Bearer your_api_key_here
```

To obtain an API key, visit: `/api-keys` or use the API key generation endpoint.

## Endpoints

### 1. Coverage Analysis

**Endpoint:** `POST /coverage/analyze`

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude coordinate (-90 to 90) |
| `lng` | number | Yes | Longitude coordinate (-180 to 180) |
| `address` | string | No | Human-readable address for context |
| `provider` | string | No | Specific provider to analyze ("auto" for country defaults) |

#### Supported Providers

**Mobile Carriers:**
- Verizon, AT&T, T-Mobile (US)
- Rogers, Bell, Telus (Canada)
- DOTM (International)

**Broadband Providers:**
- Comcast, Spectrum, Verizon Fios, AT&T Internet (US)
- Rogers Internet, Bell Internet, Telus Internet (Canada)

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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `coverage_score` | number | Coverage quality score (0-100) |
| `reliability_rating` | number | Reliability rating (1-5 stars) |
| `recent_issues` | number | Number of issues in analysis period |
| `issue_summary` | string | AI-generated summary of network issues |
| `recommendation` | string | Overall recommendation (excellent/good/fair/poor) |
| `confidence_score` | number | Analysis confidence level (0-1) |
| `last_major_outage` | string | Date of last significant outage |

### 2. Issue Reporting & Analysis

**Endpoint:** `POST /coverage/analyze-issue`

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

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude coordinate |
| `lng` | number | Yes | Longitude coordinate |
| `address` | string | No | Location address |
| `issue_description` | string | Yes | Description of the network issue |
| `user_agent` | string | No | Browser user agent for device detection |

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

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Invalid coordinates",
  "message": "Latitude must be between -90 and 90"
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Missing or invalid API key |
| 429 | Rate Limited | Exceeded 100 requests per hour limit |
| 500 | Internal Error | Server error during analysis |

## Rate Limiting

- **Limit:** 100 requests per hour per IP address
- **Headers:** Rate limit information included in response headers
- **Reset:** Limit resets every hour

## Caching

Coverage analysis results are cached for 30 minutes to improve performance:
- Cache key based on coordinates and provider selection
- Cached responses return instantly
- Fresh data fetched after cache expiration

## Geographic Coverage

### Automatic Provider Detection

The API automatically detects the largest providers in your country:

- **United States:** Verizon, AT&T, T-Mobile
- **Canada:** Rogers, Bell, Telus
- **International:** Major global providers

### Coordinate Boundaries

- **US:** 24.5°N to 49.3°N, -125°W to -66.9°W
- **Canada:** 41.7°N to 83.1°N, -141°W to -52.6°W
- **Global:** All other coordinates supported

## Code Examples

### JavaScript/Node.js

```javascript
const analyzeWeaning = async (lat, lng, provider = 'auto') => {
  const response = await fetch('/api/coverage/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      provider: provider
    })
  });
  
  const result = await response.json();
  return result.data;
};
```

### Python

```python
import requests

def analyze_coverage(lat, lng, api_key, provider='auto'):
    url = 'https://api.deviceinsights.net/coverage/analyze'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    data = {
        'lat': lat,
        'lng': lng,
        'provider': provider
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()
```

### cURL

```bash
curl -X POST https://api.deviceinsights.net/coverage/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "lat": 43.6532,
    "lng": -79.3832,
    "address": "Toronto, ON, Canada",
    "provider": "Rogers"
  }'
```

## Google Maps Integration

### Static Maps Thumbnail

Generate a thumbnail showing the 10km coverage area:

```
https://maps.googleapis.com/maps/api/staticmap?
  center={lat},{lng}&
  zoom=12&
  size=600x300&
  maptype=roadmap&
  markers=color:red|{lat},{lng}&
  circle=fillcolor:0x0080FF30|color:0x0080FFFF|weight:2|{lat},{lng},10000&
  key={google_maps_api_key}
```

### Interactive Maps Link

Open the area in Google Maps:

```
https://www.google.com/maps/@{lat},{lng},13z
```

## AI Analysis Features

### Pattern Recognition
- Identifies similar issues by device type, location, and problem description
- Analyzes historical patterns and trends
- Provides device-specific recommendations

### Confidence Scoring
- **0.9-1.0:** High confidence - extensive data available
- **0.7-0.9:** Good confidence - sufficient data for analysis
- **0.5-0.7:** Moderate confidence - limited data available
- **0.0-0.5:** Low confidence - minimal data, results may vary

### Issue Categories
- Network outages (no signal, complete service loss)
- Performance issues (slow data, dropped calls)
- Connectivity problems (intermittent service)
- Infrastructure issues (tower maintenance, equipment failure)

## Best Practices

### Optimization
1. Use caching - repeated requests return instantly
2. Specify provider when analyzing single network
3. Include address for better context and logging
4. Handle rate limits gracefully with exponential backoff

### Error Handling
1. Always check response status codes
2. Implement retry logic for 500 errors
3. Validate coordinates before sending requests
4. Handle network timeouts (analysis can take 30+ seconds)

### Data Interpretation
1. Consider confidence scores when making decisions
2. Combine coverage score with reliability rating
3. Recent issues indicate current network stability
4. Issue summaries provide context for scores

## Support

For technical support or API questions:
- Email: rbm@dotmobile.app first with questions
- Documentation: Visit `/coverage-maps` for interactive testing
- Status: Monitor API health at your deployment URL

## Changelog

### Version 1.0 (January 2025)
- Initial release with coverage analysis
- AI-powered issue reporting and pattern recognition
- Google Maps integration with thumbnail generation
- Provider selection and country-based auto-detection
- Performance caching with 30-minute TTL
- Comprehensive error handling and rate limiting

---

*This API is currently in Alpha status. Results are experimental and should be verified with additional sources for critical decisions.*