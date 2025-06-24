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
 * - Admin interface for property selection with authentication
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

// Authentication Manager
class AuthManager {
    constructor(env) {
        this.adminUsername = env.ADMIN_USERNAME;
        this.adminPassword = env.ADMIN_PASSWORD;
        this.sessionSecret = env.SESSION_SECRET;

        // Validate required credentials
        if (!this.adminUsername || !this.adminPassword || !this.sessionSecret) {
            throw new Error('Missing required authentication credentials. Please set ADMIN_USERNAME, ADMIN_PASSWORD, and SESSION_SECRET environment variables.');
        }
    }

    // Simple session token generation
    generateSessionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${timestamp}:${random}:${this.sessionSecret}`).replace(/[^a-zA-Z0-9]/g, '');
    }

    // Verify session token
    verifySessionToken(token) {
        try {
            const decoded = atob(token);
            const [timestamp, random, secret] = decoded.split(':');

            // Check if session is not expired (24 hours)
            const sessionAge = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            return secret === this.sessionSecret && sessionAge < maxAge;
        } catch (error) {
            return false;
        }
    }

    // Authenticate user
    authenticate(username, password) {
        return username === this.adminUsername && password === this.adminPassword;
    }
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
        return errorResponse('Login failed', 500);
    }
}

async function handleLogout(request, env) {
    return new Response(JSON.stringify({
        success: true,
        message: 'Logout successful'
    }), {
        status: 200,
        headers: {
            ...corsHeaders,
            'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        }
    });
}

// Middleware to check authentication
function requireAuth(request, env) {
    const authManager = new AuthManager(env);

    // Check for session token in cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});

        if (cookies.session && authManager.verifySessionToken(cookies.session)) {
            return null; // Authenticated
        }
    }

    // Check for Authorization header (for API calls)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (authManager.verifySessionToken(token)) {
            return null; // Authenticated
        }
    }

    return errorResponse('Authentication required', 401);
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
    // Check authentication
    const authError = requireAuth(request, env);
    if (authError) return authError;

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
    // Check authentication
    const authError = requireAuth(request, env);
    if (authError) return authError;

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
            const rentmanUrl = `https://www.rentman.online/propertymedia.php?propref=${encodeURIComponent(propref)}`;
            const rentmanResponse = await fetch(rentmanUrl, {
                headers: { 'token': token }
            });
            if (!rentmanResponse.ok) {
                const text = await rentmanResponse.text();
                return errorResponse(`Failed to fetch media list: ${rentmanResponse.status} - ${text}`, 502);
            }
            let mediaList;
            try {
                mediaList = await rentmanResponse.json();
            } catch (err) {
                return errorResponse('Invalid JSON from Rentman media list', 502);
            }
            return new Response(JSON.stringify(mediaList), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        } else if (filename) {
            // Fetch the image itself
            const rentmanUrl = `https://www.rentman.online/propertymedia.php?filename=${encodeURIComponent(filename)}`;
            const rentmanResponse = await fetch(rentmanUrl, {
                headers: {
                    'token': token,
                    'ACCEPT': 'application/base64'
                }
            });
            if (!rentmanResponse.ok) {
                const text = await rentmanResponse.text();
                return errorResponse(`Failed to fetch image: ${rentmanResponse.status} - ${text}`, 502);
            }
            const base64 = await rentmanResponse.text();
            if (!base64 || base64.length < 10) {
                return errorResponse('No image data received from Rentman', 502);
            }
            // Convert base64 to binary
            let binary;
            try {
                binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            } catch (err) {
                return errorResponse('Failed to decode base64 image', 502);
            }
            // Guess content type from filename extension
            let contentType = 'image/jpeg';
            if (filename.match(/\.png$/i)) contentType = 'image/png';
            else if (filename.match(/\.gif$/i)) contentType = 'image/gif';
            else if (filename.match(/\.webp$/i)) contentType = 'image/webp';
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

// Login page HTML
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
            
            // Show loading state
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
                    // Store session token
                    localStorage.setItem('sessionToken', data.sessionToken);
                    // Redirect to admin dashboard
                    window.location.href = '/admin';
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                showError('Invalid username or password');
            } finally {
                loginBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
        
        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    </script>
</body>
</html>`;
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
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .logout-btn { 
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 14px;
        }
        .logout-btn:hover { background: #c82333; }
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
            <div class="header-top">
                <h1>London Move Admin Dashboard</h1>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
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
        let sessionToken = localStorage.getItem('sessionToken');

        // Check authentication on page load
        if (!sessionToken) {
            window.location.href = '/login';
        }

        async function loadProperties() {
            try {
                const response = await fetch('/api/admin/properties', {
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
                });
                
                if (response.status === 401) {
                    // Unauthorized - redirect to login
                    localStorage.removeItem('sessionToken');
                    window.location.href = '/login';
                    return;
                }
                
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
                const response = await fetch('/api/properties/featured/toggle', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({ propertyId })
                });
                
                if (response.status === 401) {
                    // Unauthorized - redirect to login
                    localStorage.removeItem('sessionToken');
                    window.location.href = '/login';
                    return;
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Instead of updating local state, reload the properties from the backend to ensure sync
                    await loadProperties();
                } else {
                    throw new Error(data.error || 'Failed to toggle featured status');
                }
            } catch (error) {
                showError('Failed to toggle featured status: ' + error.message);
            }
        }

        async function logout() {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
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
export { RentmanAPI, FeaturedPropertiesManager, AuthManager };