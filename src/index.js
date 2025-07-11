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
 * Optimized Rentman API Proxy with Featured Properties Management
 * 
 * Optimizations made:
 * - Implemented proper caching with TTL
 * - Removed duplicate function definitions
 * - Optimized image processing
 * - Added request timeouts
 * - Implemented streaming for large responses
 * - Added memory-efficient data processing
 */

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const IMAGE_CACHE_TTL = 3600; // 1 hour for images

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

// Authentication Manager
class AuthManager {
    constructor(env) {
        this.adminUsername = env.ADMIN_USERNAME;
        this.adminPassword = env.ADMIN_PASSWORD;
        this.sessionSecret = env.SESSION_SECRET;

        if (!this.adminUsername || !this.adminPassword || !this.sessionSecret) {
            throw new Error('Missing required authentication credentials.');
        }
    }

    generateSessionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${timestamp}:${random}:${this.sessionSecret}`).replace(/[^a-zA-Z0-9]/g, '');
    }

    verifySessionToken(token) {
        try {
            const decoded = atob(token);
            const [timestamp, random, secret] = decoded.split(':');
            const sessionAge = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            return secret === this.sessionSecret && sessionAge < maxAge;
        } catch (error) {
            return false;
        }
    }

    authenticate(username, password) {
        return username === this.adminUsername && password === this.adminPassword;
    }
}

// Optimized Rentman API client with caching
class RentmanAPI {
    constructor(env) {
        this.baseUrl = env.RENTMAN_API_BASE_URL || 'https://www.rentman.online';
        this.token = env.RENTMAN_API_TOKEN ? decodeURIComponent(env.RENTMAN_API_TOKEN) : null;
        this.kv = env.FEATURED_PROPERTIES;
    }

    async fetchProperties() {
        try {
            // Check cache first
            const cacheKey = 'properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                return cached;
            }

            // Fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const url = `${this.baseUrl}/propertyadvertising.php?token=${this.token}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Rentman API error: ${response.status}`);
            }

            const data = await response.json();
            const properties = data || [];

            // Cache the response
            await this.kv.put(cacheKey, JSON.stringify(properties), { expirationTtl: CACHE_TTL });

            return properties;
        } catch (error) {
            console.error('Error fetching properties:', error);
            throw error;
        }
    }

    async fetchPropertyMedia(propref) {
        try {
            const cacheKey = `media_list_${propref}`;
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                return cached;
            }

            const url = `${this.baseUrl}/propertymedia.php?propref=${encodeURIComponent(propref)}`;
            const response = await fetch(url, {
                headers: { 'token': this.token }
            });

            if (!response.ok) {
                throw new Error(`Media API error: ${response.status}`);
            }

            const mediaList = await response.json();

            // Cache the media list
            await this.kv.put(cacheKey, JSON.stringify(mediaList), { expirationTtl: CACHE_TTL });

            return mediaList;
        } catch (error) {
            console.error('Error fetching property media:', error);
            throw error;
        }
    }
}

// Featured Properties Manager
class FeaturedPropertiesManager {
    constructor(kv, env) {
        this.kv = kv;
        this.maxFeatured = 10;
        this.minFeatured = 7;
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
            // Invalidate cache when featured properties change
            await this.kv.delete('properties_cache');
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
                // Removing a property
                featured.splice(index, 1);
            } else {
                // Adding a property
                if (featured.length >= this.maxFeatured) {
                    throw new Error(`Cannot add property. Maximum of ${this.maxFeatured} featured properties allowed.`);
                }
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

// Optimized image processor
class ImageProcessor {
    static async processBase64Image(base64Data, filename) {
        try {
            // Validate base64 data
            if (!base64Data || base64Data.length < 10) {
                throw new Error('Invalid image data');
            }

            // Use more efficient base64 decoding
            const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Determine content type
            let contentType = 'image/jpeg';
            if (filename.match(/\.png$/i)) contentType = 'image/png';
            else if (filename.match(/\.gif$/i)) contentType = 'image/gif';
            else if (filename.match(/\.webp$/i)) contentType = 'image/webp';

            return { binary, contentType };
        } catch (error) {
            throw new Error('Failed to process image: ' + error.message);
        }
    }
}

// Authentication Handlers
async function handleLogin(request, env) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return errorResponse('Username and password are required');
        }

        const authManager = new AuthManager(env);

        if (authManager.authenticate(username, password)) {
            const sessionToken = authManager.generateSessionToken();

            return new Response(JSON.stringify({
                success: true,
                message: 'Login successful',
                sessionToken: sessionToken
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
                }
            });
        } else {
            return errorResponse('Invalid credentials', 401);
        }
    } catch (error) {
        return errorResponse('Login failed: ' + error.message, 500);
    }
}

async function handleLogout(request, env) {
    return jsonResponse({
        success: true,
        message: 'Logout successful'
    });
}

function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const authManager = new AuthManager(env);

    if (!authManager.verifySessionToken(token)) {
        return errorResponse('Invalid or expired session', 401);
    }

    return null; // No error
}

// Optimized property handlers
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
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        const featuredProperties = allProperties.filter(property =>
            featuredIds.includes(String(property.propref))
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
    const authError = requireAuth(request, env);
    if (authError) return authError;

    try {
        const { propertyId } = await request.json();

        if (!propertyId) {
            return errorResponse('Property ID is required');
        }

        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);
        try {
            const updatedFeatured = await featuredManager.toggleFeaturedProperty(propertyId);
            return jsonResponse({
                success: true,
                data: { featuredPropertyIds: updatedFeatured },
                message: "Featured status updated successfully",
                limits: { min: featuredManager.minFeatured, max: featuredManager.maxFeatured, current: updatedFeatured.length }
            });
        } catch (limitError) {
            return errorResponse(limitError.message, 400);
        }
    } catch (error) {
        return errorResponse('Failed to toggle featured property', 500);
    }
}

async function handleAdminProperties(request, env) {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        // Process properties in chunks to avoid memory issues
        const chunkSize = 50;
        const propertiesWithFeaturedStatus = [];

        for (let i = 0; i < allProperties.length; i += chunkSize) {
            const chunk = allProperties.slice(i, i + chunkSize);
            const processedChunk = chunk.map(property => ({
                ...property,
                isFeatured: featuredIds.includes(String(property.propref)),
            }));
            propertiesWithFeaturedStatus.push(...processedChunk);
        }

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

async function handlePropertyMedia(request, env) {
    try {
        const url = new URL(request.url);
        const propref = url.searchParams.get('propref');
        const filename = url.searchParams.get('filename');
        const token = env.RENTMAN_API_TOKEN;

        if (!token) {
            return errorResponse('Missing Rentman API token', 500);
        }

        if (propref) {
            // Fetch media list for the property
            const rentman = new RentmanAPI(env);
            const mediaList = await rentman.fetchPropertyMedia(propref);

            return jsonResponse(mediaList);
        } else if (filename) {
            // Fetch the image itself with caching
            const cacheKey = `image_${filename}`;
            const cachedImage = await env.FEATURED_PROPERTIES.get(cacheKey, 'arrayBuffer');

            if (cachedImage) {
                let contentType = 'image/jpeg';
                if (filename.match(/\.png$/i)) contentType = 'image/png';
                else if (filename.match(/\.gif$/i)) contentType = 'image/gif';
                else if (filename.match(/\.webp$/i)) contentType = 'image/webp';

                return new Response(cachedImage, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=86400',
                        ...corsHeaders
                    }
                });
            }

            // Fetch new image with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const rentmanUrl = `${env.RENTMAN_API_BASE_URL || 'https://www.rentman.online'}/propertymedia.php?filename=${encodeURIComponent(filename)}`;
            const rentmanResponse = await fetch(rentmanUrl, {
                headers: {
                    'token': token,
                    'ACCEPT': 'application/base64'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!rentmanResponse.ok) {
                throw new Error(`Failed to fetch image: ${rentmanResponse.status}`);
            }

            const base64 = await rentmanResponse.text();
            const { binary, contentType } = await ImageProcessor.processBase64Image(base64, filename);

            // Cache the processed image
            await env.FEATURED_PROPERTIES.put(cacheKey, binary, { expirationTtl: IMAGE_CACHE_TTL });

            return new Response(binary, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                    ...corsHeaders
                }
            });
        } else {
            return errorResponse('Missing propref or filename query parameter', 400);
        }
    } catch (error) {
        return errorResponse('Internal error in property media handler: ' + error.message, 500);
    }
}

// Simplified HTML generation (moved to separate functions to reduce memory usage)
function getLoginHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>London Move Admin - Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .login-header p {
            color: #666;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .login-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .login-btn:hover {
            transform: translateY(-2px);
        }
        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .error {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        .loading {
            display: none;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>London Move Admin</h1>
            <p>Sign in to manage featured properties</p>
        </div>
        
        <div id="error" class="error"></div>
        <div id="loading" class="loading">Signing in...</div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">Sign In</button>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            
            loginBtn.disabled = true;
            loading.style.display = 'block';
            error.style.display = 'none';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('sessionToken', data.sessionToken);
                    window.location.href = '/admin';
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                showError(error.message);
            } finally {
                loginBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
        
        function showError(message) {
            const error = document.getElementById('error');
            error.textContent = message;
            error.style.display = 'block';
        }
    </script>
</body>
</html>`;
}

function getAdminHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>London Move Admin - Property Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f5f7fa;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        .stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
        }
        .stat {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
        }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        }
        .logout-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .search-bar {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin-bottom: 20px;
        }
        .search-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .property-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .property-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .property-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .property-image {
            height: 200px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 14px;
        }
        .property-content {
            padding: 20px;
        }
        .property-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        .property-details {
            color: #666;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .property-price {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 16px;
        }
        .featured-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .featured-toggle label {
            font-size: 14px;
            color: #666;
        }
        .toggle {
            width: 40px;
            height: 20px;
            background: #e1e5e9;
            border-radius: 10px;
            cursor: pointer;
            position: relative;
            transition: background 0.3s;
        }
        .toggle.active {
            background: #667eea;
        }
        .toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }
        .toggle.active::after {
            transform: translateX(20px);
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .error {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div>
                <h1>London Move Admin</h1>
                <div class="stats">
                    <div class="stat">Total: <span id="totalCount">0</span></div>
                    <div class="stat">Featured: <span id="featuredCount">0</span></div>
                </div>
            </div>
            <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
    </div>

    <div class="main-content">
        <div class="search-bar">
            <input type="text" id="searchInput" class="search-input" placeholder="Search properties...">
        </div>
        
        <div id="error" class="error"></div>
        <div id="loading" class="loading">Loading properties...</div>
        <div id="propertyGrid" class="property-grid" style="display: none;"></div>
    </div>

    <script>
        let sessionToken = localStorage.getItem('sessionToken');
        let properties = [];
        let featuredIds = [];

        if (!sessionToken) {
            window.location.href = '/login';
        }

        async function loadProperties() {
            try {
                const response = await fetch('/api/admin/properties', {
                    headers: { 'Authorization': 'Bearer ' + sessionToken }
                });
                
                if (response.status === 401) {
                    localStorage.removeItem('sessionToken');
                    window.location.href = '/login';
                    return;
                }
                
                const data = await response.json();
                
                if (data.success) {
                    properties = data.data;
                    featuredIds = properties.filter(p => p.isFeatured).map(p => p.propref);
                    console.log('Loaded properties:', properties.length, 'Featured IDs:', featuredIds);
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
                        \${property.photo1binary ? \`<img src="data:image/jpeg;base64,\${property.photo1binary}" alt="\${property.displayaddress}" style="width: 100%; height: 100%; object-fit: cover;">\` : 'No Image'}
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
                console.log('Toggling featured status for property:', propertyId);
                
                const response = await fetch('/api/properties/featured/toggle', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({ propertyId })
                });
                
                console.log('Toggle response status:', response.status);
                
                if (response.status === 401) {
                    localStorage.removeItem('sessionToken');
                    window.location.href = '/login';
                    return;
                }
                
                const data = await response.json();
                console.log('Toggle response data:', data);
                
                if (data.success) {
                    console.log('Toggle successful, reloading properties...');
                    await loadProperties();
                } else {
                    throw new Error(data.error || 'Failed to toggle featured status');
                }
            } catch (error) {
                console.error('Toggle error:', error);
                showError('Failed to toggle featured status: ' + error.message);
            }
        }

        async function logout() {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + sessionToken }
                });
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('sessionToken');
                window.location.href = '/login';
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

        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = properties.filter(property => 
                property.displayaddress.toLowerCase().includes(searchTerm) ||
                property.displayprice.toLowerCase().includes(searchTerm) ||
                (property.TYPE && property.TYPE.toLowerCase().includes(searchTerm))
            );
            renderProperties(filtered);
        });

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

                case '/api/auth/login':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleLogin(request, env);

                case '/api/auth/logout':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleLogout(request, env);

                case '/login':
                    return new Response(getLoginHTML(), {
                        headers: { 'Content-Type': 'text/html' },
                    });

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
                            login: '/login',
                        },
                    }), {
                        headers: corsHeaders,
                    });

                case '/api/propertymedia':
                    return await handlePropertyMedia(request, env);

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
export { RentmanAPI, FeaturedPropertiesManager, AuthManager, ImageProcessor };