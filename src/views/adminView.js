// Simple admin interface without authentication
function getAdminHTML(env = {}) {
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
        .success {
            background: #efe;
            color: #373;
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
            <div style="color: white; font-size: 14px;">
                Property Management System
            </div>
        </div>
    </div>

    <div class="main-content">
        <div class="search-bar">
            <input type="text" id="searchInput" class="search-input" placeholder="Search properties...">
        </div>
        
        <div id="error" class="error"></div>
        <div id="success" class="success"></div>
        <div id="loading" class="loading">Loading properties...</div>
        <div id="propertyGrid" class="property-grid" style="display: none;"></div>
    </div>

    <script>
        let properties = [];
        let featuredIds = [];
        
        // Cache configuration
        const CACHE_KEY = 'londonmove_properties_cache';
        const CACHE_TTL = 300000; // 5 minutes in milliseconds
        const CACHE_VERSION = '1.0';

        async function initializeAdmin() {
            try {
                // Try to load from cache first
                await loadProperties();
                
                // Start background refresh if using cached data
                if (isUsingCachedData()) {
                    setTimeout(refreshCacheInBackground, 2000);
                }
            } catch (error) {
                console.error('Initialization error:', error);
                showError('Failed to initialize admin interface: ' + error.message);
            }
        }

        function getCachedData() {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (!cached) return null;
                
                const { data, timestamp, version } = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is still valid
                if (now - timestamp < CACHE_TTL && version === CACHE_VERSION) {
                    const cacheAge = Math.round((now - timestamp) / 1000);
                    const cacheType = data.isMinimalCache ? ' (minimal)' : data.isPartialCache ? ' (partial)' : '';
                    console.log('🚀 Using cached data (age:', cacheAge, 'seconds)' + cacheType);
                    return data;
                }
                
                // Cache expired or version mismatch
                console.log('⏰ Cache expired or outdated, will fetch fresh data');
                return null;
            } catch (error) {
                console.error('Error reading cache:', error);
                return null;
            }
        }

        function setCachedData(data) {
            try {
                // Create a lightweight version of the data for caching
                const lightweightData = {
                    properties: data.properties.map(property => {
                        // Remove large image data from cache
                        const { photo1binary, ...lightProperty } = property;
                        return lightProperty;
                    }),
                    featuredIds: data.featuredIds
                };
                
                const cacheData = {
                    data: lightweightData,
                    timestamp: Date.now(),
                    version: CACHE_VERSION
                };
                
                const serializedData = JSON.stringify(cacheData);
                const sizeInMB = (serializedData.length / (1024 * 1024)).toFixed(2);
                
                // Check if data size is reasonable (under 4MB)
                if (serializedData.length > 4 * 1024 * 1024) {
                    console.warn('⚠️ Cache data too large (' + sizeInMB + 'MB), implementing selective caching...');
                    
                    // Use selective caching - only cache essential data
                    const essentialData = {
                        properties: data.properties.slice(0, 20).map(property => ({
                            propref: property.propref,
                            displayaddress: property.displayaddress,
                            displayprice: property.displayprice,
                            beds: property.beds,
                            baths: property.baths,
                            TYPE: property.TYPE,
                            isFeatured: property.isFeatured
                        })),
                        featuredIds: data.featuredIds,
                        isPartialCache: true
                    };
                    
                    const essentialCacheData = {
                        data: essentialData,
                        timestamp: Date.now(),
                        version: CACHE_VERSION
                    };
                    
                    localStorage.setItem(CACHE_KEY, JSON.stringify(essentialCacheData));
                    console.log('💾 Essential data cached successfully (partial cache)');
                } else {
                    localStorage.setItem(CACHE_KEY, serializedData);
                    console.log('💾 Data cached successfully (' + sizeInMB + 'MB)');
                }
            } catch (error) {
                console.error('Error caching data:', error);
                
                // Fallback: Try to cache just the essential property info
                try {
                    const minimalData = {
                        properties: data.properties.map(property => ({
                            propref: property.propref,
                            displayaddress: property.displayaddress,
                            displayprice: property.displayprice,
                            beds: property.beds,
                            baths: property.baths,
                            TYPE: property.TYPE,
                            isFeatured: property.isFeatured
                        })),
                        featuredIds: data.featuredIds,
                        isMinimalCache: true
                    };
                    
                    const minimalCacheData = {
                        data: minimalData,
                        timestamp: Date.now(),
                        version: CACHE_VERSION
                    };
                    
                    localStorage.setItem(CACHE_KEY, JSON.stringify(minimalCacheData));
                    console.log('💾 Minimal data cached successfully (fallback)');
                } catch (fallbackError) {
                    console.error('❌ Failed to cache even minimal data:', fallbackError);
                }
            }
        }

        function isUsingCachedData() {
            return getCachedData() !== null;
        }

        async function loadProperties(forceRefresh = false) {
            try {
                let fromCache = false;
                
                // Try cache first unless force refresh
                if (!forceRefresh) {
                    const cachedData = getCachedData();
                    if (cachedData) {
                        properties = cachedData.properties;
                        featuredIds = cachedData.featuredIds;
                        fromCache = true;
                        
                        updateStats();
                        renderProperties();
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('propertyGrid').style.display = 'grid';
                        
                        if (fromCache) {
                            const cacheType = cachedData.isMinimalCache ? 'minimal cached' : 
                                            cachedData.isPartialCache ? 'partial cached' : 'cached';
                            showCacheStatus('Using ' + cacheType + ' data');
                        }
                        return;
                    }
                }
                
                // Show loading state
                if (!fromCache) {
                    document.getElementById('loading').style.display = 'block';
                    document.getElementById('propertyGrid').style.display = 'none';
                }
                
                console.log('📡 Fetching fresh data from API...');
                
                // Fetch fresh data
                const [propertiesResponse, featuredResponse] = await Promise.all([
                    fetch('/api/properties'),
                    fetch('/api/featured')
                ]);
                
                const propertiesData = await propertiesResponse.json();
                const featuredData = await featuredResponse.json();
                
                if (propertiesData.success && featuredData.success) {
                    properties = propertiesData.data;
                    featuredIds = featuredData.data.map(p => p.propref);
                    
                    // Add featured status to properties
                    properties = properties.map(property => ({
                        ...property,
                        isFeatured: featuredIds.includes(property.propref)
                    }));
                    
                    // Cache the data
                    setCachedData({ properties, featuredIds });
                    
                    console.log('✅ Loaded properties:', properties.length, 'Featured IDs:', featuredIds);
                    updateStats();
                    renderProperties();
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('propertyGrid').style.display = 'grid';
                    
                    showCacheStatus('Data refreshed');
                } else {
                    throw new Error(propertiesData.error || featuredData.error || 'Failed to load properties');
                }
            } catch (error) {
                console.error('Error loading properties:', error);
                showError('Failed to load properties: ' + error.message);
                document.getElementById('loading').style.display = 'none';
                
                // Try to use cached data as fallback
                const cachedData = getCachedData();
                if (cachedData && !forceRefresh) {
                    properties = cachedData.properties;
                    featuredIds = cachedData.featuredIds;
                    
                    properties = properties.map(property => ({
                        ...property,
                        isFeatured: featuredIds.includes(property.propref)
                    }));
                    
                    updateStats();
                    renderProperties();
                    document.getElementById('propertyGrid').style.display = 'grid';
                    
                    const cacheType = cachedData.isMinimalCache ? 'minimal cached' : 
                                    cachedData.isPartialCache ? 'partial cached' : 'cached';
                    showCacheStatus('Using ' + cacheType + ' data (network error)');
                }
            }
        }

        async function refreshCacheInBackground() {
            try {
                console.log('🔄 Background refresh started...');
                await loadProperties(true);
            } catch (error) {
                console.error('Background refresh failed:', error);
            }
        }

        function showCacheStatus(message) {
            const statusDiv = document.getElementById('success');
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 2000);
        }

        function clearCache() {
            localStorage.removeItem(CACHE_KEY);
            console.log('🗑️ Cache cleared');
        }

        function getCacheStats() {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (!cached) return { exists: false, size: 0, sizeFormatted: '0 KB' };
                
                const sizeInBytes = cached.length;
                const sizeInKB = (sizeInBytes / 1024).toFixed(2);
                const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
                
                return {
                    exists: true,
                    size: sizeInBytes,
                    sizeFormatted: sizeInBytes > 1024 * 1024 ? sizeInMB + ' MB' : sizeInKB + ' KB'
                };
            } catch (error) {
                console.error('Error getting cache stats:', error);
                return { exists: false, size: 0, sizeFormatted: '0 KB' };
            }
        }

        function showCacheInfo() {
            const stats = getCacheStats();
            const cachedData = getCachedData();
            
            if (stats.exists && cachedData) {
                const cacheType = cachedData.isMinimalCache ? 'Minimal' : 
                                cachedData.isPartialCache ? 'Partial' : 'Full';
                const propertyCount = cachedData.properties ? cachedData.properties.length : 0;
                
                console.log('📊 Cache Info:', {
                    type: cacheType,
                    size: stats.sizeFormatted,
                    properties: propertyCount,
                    featured: cachedData.featuredIds ? cachedData.featuredIds.length : 0,
                    ageSeconds: Math.round((Date.now() - cachedData.timestamp) / 1000)
                });
            } else {
                console.log('📊 No cache data available');
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
                
                const response = await fetch('/api/featured/toggle', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ propertyId })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Clear cache since featured properties changed
                    clearCache();
                    showSuccess('Featured status updated successfully');
                    await loadProperties(true); // Force refresh
                } else {
                    throw new Error(data.error || 'Failed to toggle featured status');
                }
            } catch (error) {
                console.error('Toggle error:', error);
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

        function showSuccess(message) {
            const successDiv = document.getElementById('success');
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
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

        // Initialize when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAdmin);
        } else {
            initializeAdmin();
        }
    </script>
</body>
</html>`;
}

export { getAdminHTML };