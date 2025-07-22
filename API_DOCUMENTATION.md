# IMEI Device Checker API Documentation

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
  "network": "OXIO"
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