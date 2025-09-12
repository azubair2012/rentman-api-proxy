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

// ✅ NEW: Image optimization utilities
function compressBase64Image(base64Data, quality = 0.8) {
    try {
        // For now, return as-is (could implement Canvas-based compression in the future)
        return base64Data;
    } catch (error) {
        console.warn('Image compression failed:', error);
        return base64Data;
    }
}

function isValidBase64Image(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') return false;
    
    // Check if it's valid base64 and reasonable size
    try {
        const withoutHeader = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Basic validation
        if (withoutHeader.length < 100) return false; // Too small
        if (withoutHeader.length > 10 * 1024 * 1024) return false; // Too large (>10MB)
        
        // Check if valid base64
        const decoded = atob(withoutHeader.substring(0, 100)); // Test first 100 chars
        return decoded.length > 0;
    } catch (error) {
        return false;
    }
}

function getImageMetadata(base64Data) {
    if (!isValidBase64Image(base64Data)) {
        return { isValid: false, size: 0, type: 'unknown' };
    }
    
    try {
        const withoutHeader = base64Data.replace(/^data:image\/([a-z]+);base64,/, '');
        const type = base64Data.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'jpeg';
        const sizeInBytes = (withoutHeader.length * 3) / 4; // Approximate base64 size
        
        return {
            isValid: true,
            size: sizeInBytes,
            type: type,
            sizeFormatted: sizeInBytes > 1024 * 1024 
                ? `${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB`
                : `${Math.round(sizeInBytes / 1024)}KB`
        };
    } catch (error) {
        return { isValid: false, size: 0, type: 'unknown' };
    }
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
    errorResponse,
    compressBase64Image,
    isValidBase64Image,
    getImageMetadata
};
