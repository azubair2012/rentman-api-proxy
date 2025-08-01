// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

// Cache configuration
const CACHE_TTL = 300; // 5 minutes - Properties metadata
const IMAGE_CACHE_TTL = 3600; // 1 hour for images
const PROPERTY_IMAGE_PREFIX = 'prop_img_'; // ✅ ADD: Image cache key prefix

// ✅ PHASE 2: Smart TTL Management - Different durations for different data types
const FEATURED_PROPERTIES_TTL = 86400; // 24 hours - Featured property IDs change less frequently
const MEDIA_LIST_TTL = 1800; // 30 minutes - Media lists
const ADMIN_VIEW_TTL = 600; // 10 minutes - Admin interface data

// Helper function to handle CORS preflight requests
function handleCORS(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }
}

// Helper function to create JSON response with CORS headers
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders,
    });
}

// Helper function to create error response
function errorResponse(message, status = 400) {
    return jsonResponse({ error: message }, status);
}

export { 
    corsHeaders, 
    CACHE_TTL, 
    IMAGE_CACHE_TTL, 
    PROPERTY_IMAGE_PREFIX, 
    FEATURED_PROPERTIES_TTL,
    MEDIA_LIST_TTL,
    ADMIN_VIEW_TTL,
    handleCORS, 
    jsonResponse, 
    errorResponse 
};
