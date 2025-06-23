# Rentman API Proxy - API Documentation

## Overview
This API proxy provides a secure interface between your Framer website and the Rentman property management system, with additional featured properties management functionality.

## Base URL
- **Development**: `http://localhost:8787`
- **Production**: `https://your-worker.your-subdomain.workers.dev`

## Authentication
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

**Endpoint:** `GET /api/properties/featured`

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

### 3. Toggle Featured Property
Toggles the featured status of a specific property.

**Endpoint:** `POST /api/properties/featured/toggle`

**Request Body:**
```json
{
  "propertyId": "PROP001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "featuredPropertyIds": ["PROP001", "PROP002"]
  },
  "message": "Featured status updated successfully"
}
```

### 4. Admin Properties (with Featured Status)
Retrieves all properties with their featured status for the admin interface.

**Endpoint:** `GET /api/admin/properties`

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
      "TYPE": "House",
      "isFeatured": true
    }
  ],
  "count": 1,
  "featuredCount": 1
}
```

### 5. Admin Interface
Provides a web-based admin interface for managing featured properties.

**Endpoint:** `GET /admin`

**Response:** HTML page with property management dashboard

### 6. API Information
Returns basic information about the API.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Rentman API Proxy",
  "endpoints": {
    "properties": "/api/properties",
    "featured": "/api/properties/featured",
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
| `isFeatured` | boolean | Whether property is featured (admin endpoint only) |

## CORS Support

All endpoints include CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Usage Examples

### Framer Integration
```javascript
// Fetch featured properties for Framer
const response = await fetch('https://your-worker.workers.dev/api/properties/featured');
const data = await response.json();

if (data.success) {
  // Use data.data array in Framer
  console.log(data.data);
}
```

### Admin Interface
```javascript
// Toggle featured property
const response = await fetch('https://your-worker.workers.dev/api/properties/featured/toggle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    propertyId: 'PROP001'
  })
});

const data = await response.json();
console.log(data.message);
```

## Environment Variables

The following environment variables must be configured:

- `RENTMAN_API_TOKEN` - Rentman API authentication token
- `RENTMAN_API_USERNAME` - Rentman API username
- `RENTMAN_API_PASSWORD` - Rentman API password
- `RENTMAN_API_BASE_URL` - Rentman API base URL (default: https://api.rentman.net)
- `MAX_FEATURED_PROPERTIES` - Maximum number of featured properties (default: 6)

## Security Considerations

1. **API Credentials**: Never expose Rentman API credentials in client-side code
2. **CORS**: Configure `ALLOWED_ORIGINS` for production to restrict access
3. **Admin Access**: Implement proper authentication for admin endpoints in production
4. **Rate Limiting**: Consider implementing rate limiting for production use
5. **HTTPS**: Always use HTTPS in production environments 