# Rentman API Proxy - API Documentation

## Overview
This API proxy provides a secure interface between your Framer website and the Rentman property management system, with additional featured properties management functionality.

## Base URL
- **Development**: `http://localhost:8787`
- **Production**: `https://your-worker.your-subdomain.workers.dev`

## Authentication
**Note: Authentication has been temporarily disabled for development purposes.**
All endpoints support CORS and are designed for cross-origin requests from Framer websites.

## Endpoints

### 1. Get All Properties
Retrieves all properties from the Rentman API.

**Endpoint:** `GET /api/properties`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "propref": "PROP001",
      "displayaddress": "123 Main Street, City",
      "displayprice": "$500,000",
      "photo1": "https://example.com/image1.jpg",
      "beds": 3,
      "baths": 2,
      "TYPE": "House"
    }
  ],
  "count": 1
}
```

### 2. Get Featured Properties
Retrieves only the properties marked as featured.

**Endpoint:** `GET /api/featured`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "propref": "PROP001",
      "displayaddress": "123 Main Street, City",
      "displayprice": "$500,000",
      "photo1": "https://example.com/image1.jpg",
      "beds": 3,
      "baths": 2,
      "TYPE": "House"
    }
  ],
  "count": 1
}
```

### 3. Admin Interface
Provides a web-based admin interface for managing featured properties.

**Endpoint:** `GET /` or `GET /admin`

**Response:** HTML page with property management dashboard

### 4. API Information
Returns basic information about the API.

**Endpoint:** `GET /` (when accessed programmatically)

**Response:**
```json
{
  "message": "Rentman API Proxy",
  "endpoints": {
    "properties": "/api/properties",
    "featured": "/api/featured",
    "admin": "/admin"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Property Data Structure

Each property object contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `propref` | string | Unique property reference ID |
| `displayaddress` | string | Formatted property address |
| `displayprice` | string | Formatted property price |
| `photo1` | string | URL to primary property image |
| `beds` | number | Number of bedrooms |
| `baths` | number | Number of bathrooms |
| `TYPE` | string | Property type (House, Apartment, etc.) |

## CORS Support

All endpoints include CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Usage Examples

### Framer Integration
```javascript
// Fetch all properties
const allProperties = await fetch('https://your-worker.workers.dev/api/properties');
const allData = await allProperties.json();

// Fetch featured properties for Framer
const featuredResponse = await fetch('https://your-worker.workers.dev/api/featured');
const featuredData = await featuredResponse.json();

if (featuredData.success) {
  // Use featuredData.data array in Framer
  console.log(featuredData.data);
}
```

### Testing Endpoints
```javascript
// Test all properties endpoint
fetch('http://localhost:8787/api/properties')
  .then(response => response.json())
  .then(data => console.log('All properties:', data));

// Test featured properties endpoint  
fetch('http://localhost:8787/api/featured')
  .then(response => response.json())
  .then(data => console.log('Featured properties:', data));
```

## Environment Variables

The following environment variables must be configured:

- `RENTMAN_API_TOKEN` - Rentman API authentication token
- `RENTMAN_API_USERNAME` - Rentman API username
- `RENTMAN_API_PASSWORD` - Rentman API password
- `RENTMAN_API_BASE_URL` - Rentman API base URL (default: https://api.rentman.net)
- `MAX_FEATURED_PROPERTIES` - Maximum number of featured properties (default: 6)

## Current Status

**Development Mode**: Authentication is currently disabled for easier development and testing.

## Caching Strategy

### Server-Side Caching
- **KV Storage**: 5-minute TTL for property data
- **Cache Keys**: 
  - `properties_cache` - All properties
  - `media_list_{propref}` - Property media
- **Cache Invalidation**: Automatic when featured properties change

### Client-Side Caching
- **LocalStorage**: 5-minute TTL for instant loading
- **Smart Size Management**: Excludes large image data from cache
- **Progressive Fallback**: Full → Partial → Minimal cache levels
- **Background Refresh**: Silent updates without user waiting
- **Fallback Support**: Uses cached data during network failures
- **Smart Invalidation**: Clears cache when featured properties change
- **Quota Protection**: Prevents localStorage quota exceeded errors

### Cache Optimization Levels
1. **Full Cache**: All property data (excluding images) ~50-200KB
2. **Partial Cache**: First 20 properties only ~25-100KB
3. **Minimal Cache**: Essential fields only ~10-50KB

### Performance Benefits
- **First Load**: ~2-3 seconds (initial API call)
- **Subsequent Loads**: ~0.1-0.2 seconds (from cache)
- **Background Updates**: Transparent to users
- **Offline Support**: Works with cached data
- **Storage Efficient**: Images load fresh (server-cached)
- **Error Resilient**: Multiple fallback strategies

## Security Considerations

1. **API Credentials**: Never expose Rentman API credentials in client-side code
2. **CORS**: Configure `ALLOWED_ORIGINS` for production to restrict access
3. **Authentication**: Re-enable authentication for production use
4. **Rate Limiting**: Consider implementing rate limiting for production use
5. **HTTPS**: Always use HTTPS in production environments 