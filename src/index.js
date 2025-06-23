/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Rentman API Proxy with Featured Properties Management
 * 
 * This Cloudflare Worker provides:
 * - Rentman API integration for property data
 * - Featured properties management with KV storage
 * - Admin interface for property selection
 * - CORS support for Framer integration
 */

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

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

// Rentman API client
class RentmanAPI {
    constructor(env) {
        this.baseUrl = env.RENTMAN_API_BASE_URL || 'https://www.rentman.online';
        // Decode the token since Rentman API expects it decoded, not encoded
        console.log('Original token:', env.RENTMAN_API_TOKEN ? env.RENTMAN_API_TOKEN.substring(0, 20) + '...' : 'null');
        this.token = env.RENTMAN_API_TOKEN ? decodeURIComponent(env.RENTMAN_API_TOKEN) : null;
        console.log('Decoded token:', this.token ? this.token.substring(0, 20) + '...' : 'null');
    }

    async fetchProperties() {
        try {
            // Send token as a decoded query parameter (not as a header)
            const url = `${this.baseUrl}/propertyadvertising.php?token=${this.token}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Rentman API error:', response.status, errorText);
                throw new Error(`Rentman API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching properties:', error);
            throw error;
        }
    }
}

// Featured Properties Manager
class FeaturedPropertiesManager {
    constructor(kv) {
        this.kv = kv;
    }

    async getFeaturedPropertyIds() {
        try {
            const featured = await this.kv.get('featured_properties', 'json');
            return featured || [];
        } catch (error) {
            console.error('Error getting featured properties:', error);
            return [];
        }
    }

    async setFeaturedPropertyIds(propertyIds) {
        try {
            await this.kv.put('featured_properties', JSON.stringify(propertyIds));
            return true;
        } catch (error) {
            console.error('Error setting featured properties:', error);
            return false;
        }
    }

    async toggleFeaturedProperty(propertyId) {
        try {
            const featured = await this.getFeaturedPropertyIds();
            const index = featured.indexOf(propertyId);

            if (index > -1) {
                featured.splice(index, 1);
            } else {
                featured.push(propertyId);
            }

            await this.setFeaturedPropertyIds(featured);
            return featured;
        } catch (error) {
            console.error('Error toggling featured property:', error);
            throw error;
        }
    }
}

// API Handlers
async function handleGetProperties(request, env) {
    try {
        const rentman = new RentmanAPI(env);
        const properties = await rentman.fetchProperties();

        return jsonResponse({
            success: true,
            data: properties,
            count: properties.length,
        });
    } catch (error) {
        return errorResponse('Failed to fetch properties', 500);
    }
}

async function handleGetFeaturedProperties(request, env) {
    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        const featuredProperties = allProperties.filter(property =>
            featuredIds.includes(property.propref)
        );

        return jsonResponse({
            success: true,
            data: featuredProperties,
            count: featuredProperties.length,
        });
    } catch (error) {
        return errorResponse('Failed to fetch featured properties', 500);
    }
}

async function handleToggleFeaturedProperty(request, env) {
    try {
        const { propertyId } = await request.json();

        if (!propertyId) {
            return errorResponse('Property ID is required');
        }

        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES);
        const updatedFeatured = await featuredManager.toggleFeaturedProperty(propertyId);

        return jsonResponse({
            success: true,
            data: { featuredPropertyIds: updatedFeatured },
            message: 'Featured status updated successfully',
        });
    } catch (error) {
        return errorResponse('Failed to toggle featured property', 500);
    }
}

async function handleAdminProperties(request, env) {
    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        // Add featured status to each property
        const propertiesWithFeaturedStatus = allProperties.map(property => ({
            ...property,
            isFeatured: featuredIds.includes(property.propref),
        }));

        return jsonResponse({
            success: true,
            data: propertiesWithFeaturedStatus,
            count: propertiesWithFeaturedStatus.length,
            featuredCount: featuredIds.length,
        });
    } catch (error) {
        console.error('Admin properties error:', error);
        return errorResponse('Failed to fetch admin properties: ' + error.message, 500);
    }
}

// Admin interface HTML
function getAdminHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>London Move Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #333; margin-bottom: 10px; }
        .stats { display: flex; gap: 20px; }
        .stat { background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .controls { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .search { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px; }
        .property-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .property-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .property-image { width: 100%; height: 200px; background: #eee; display: flex; align-items: center; justify-content: center; }
        .property-content { padding: 15px; }
        .property-title { font-weight: bold; margin-bottom: 10px; color: #333; }
        .property-details { color: #666; margin-bottom: 10px; }
        .property-price { font-size: 1.2em; font-weight: bold; color: #2c7be5; margin-bottom: 10px; }
        .featured-toggle { display: flex; align-items: center; gap: 10px; }
        .toggle { position: relative; width: 50px; height: 24px; background: #ccc; border-radius: 12px; cursor: pointer; transition: background 0.3s; }
        .toggle.active { background: #2c7be5; }
        .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.3s; }
        .toggle.active::after { transform: translateX(26px); }
        .loading { text-align: center; padding: 40px; color: #666; }
        .error { background: #fee; color: #c33; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>London Move Admin Dashboard</h1>
            <div class="stats">
                <div class="stat">Total Properties: <span id="totalCount">-</span></div>
                <div class="stat">Featured Properties: <span id="featuredCount">-</span></div>
            </div>
        </div>
        
        <div class="controls">
            <input type="text" class="search" placeholder="Search properties..." id="searchInput">
        </div>
        
        <div id="error" class="error" style="display: none;"></div>
        <div id="loading" class="loading">Loading properties...</div>
        <div id="propertyGrid" class="property-grid" style="display: none;"></div>
    </div>

    <script>
        let properties = [];
        let featuredIds = [];

        async function loadProperties() {
            try {
                const response = await fetch('/api/admin/properties');
                const data = await response.json();
                
                if (data.success) {
                    properties = data.data;
                    featuredIds = properties.filter(p => p.isFeatured).map(p => p.propref);
                    updateStats();
                    renderProperties();
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('propertyGrid').style.display = 'grid';
                } else {
                    throw new Error(data.error || 'Failed to load properties');
                }
            } catch (error) {
                showError('Failed to load properties: ' + error.message);
                document.getElementById('loading').style.display = 'none';
            }
        }

        function updateStats() {
            document.getElementById('totalCount').textContent = properties.length;
            document.getElementById('featuredCount').textContent = featuredIds.length;
        }

        function renderProperties(filteredProperties = properties) {
            const grid = document.getElementById('propertyGrid');
            grid.innerHTML = filteredProperties.map(property => \`
                <div class="property-card">
                    <div class="property-image">
                        \${property.photo1 ? \`<img src="\${property.photo1}" alt="\${property.displayaddress}" style="width: 100%; height: 100%; object-fit: cover;">\` : 'No Image'}
                    </div>
                    <div class="property-content">
                        <div class="property-title">\${property.displayaddress}</div>
                        <div class="property-details">
                            \${property.beds || 0} beds • \${property.baths || 0} baths • \${property.TYPE || 'Property'}
                        </div>
                        <div class="property-price">\${property.displayprice || 'Price on request'}</div>
                        <div class="featured-toggle">
                            <label>Featured:</label>
                            <div class="toggle \${property.isFeatured ? 'active' : ''}" 
                                 onclick="toggleFeatured('\${property.propref}')"></div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        async function toggleFeatured(propertyId) {
            try {
                const response = await fetch('/api/properties/featured/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update local state
                    const property = properties.find(p => p.propref === propertyId);
                    if (property) {
                        property.isFeatured = !property.isFeatured;
                        if (property.isFeatured) {
                            featuredIds.push(propertyId);
                        } else {
                            featuredIds = featuredIds.filter(id => id !== propertyId);
                        }
                        updateStats();
                        renderProperties();
                    }
                } else {
                    throw new Error(data.error || 'Failed to toggle featured status');
                }
            } catch (error) {
                showError('Failed to toggle featured status: ' + error.message);
            }
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = properties.filter(property => 
                property.displayaddress.toLowerCase().includes(searchTerm) ||
                property.displayprice.toLowerCase().includes(searchTerm) ||
                (property.TYPE && property.TYPE.toLowerCase().includes(searchTerm))
            );
            renderProperties(filtered);
        });

        // Load properties on page load
        loadProperties();
    </script>
</body>
</html>`;
}

// Main request handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight requests
        const corsResponse = handleCORS(request);
        if (corsResponse) return corsResponse;

        try {
            switch (path) {
                case '/api/properties':
                    return await handleGetProperties(request, env);

                case '/api/properties/featured':
                    return await handleGetFeaturedProperties(request, env);

                case '/api/properties/featured/toggle':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleToggleFeaturedProperty(request, env);

                case '/api/admin/properties':
                    return await handleAdminProperties(request, env);

                case '/admin':
                    return new Response(getAdminHTML(), {
                        headers: { 'Content-Type': 'text/html' },
                    });

                case '/':
                    return new Response(JSON.stringify({
                        message: 'Rentman API Proxy',
                        endpoints: {
                            properties: '/api/properties',
                            featured: '/api/properties/featured',
                            admin: '/admin',
                        },
                    }), {
                        headers: corsHeaders,
                    });

                default:
                    return errorResponse('Not Found', 404);
            }
        } catch (error) {
            console.error('Request error:', error);
            return errorResponse('Internal Server Error', 500);
        }
    },
};

// Export classes for testing
export { RentmanAPI, FeaturedPropertiesManager };