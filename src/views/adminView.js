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

        async function initializeAdmin() {
            try {
                // Load properties directly without authentication
                await loadProperties();
            } catch (error) {
                console.error('Initialization error:', error);
                showError('Failed to initialize admin interface: ' + error.message);
            }
        }

        async function loadProperties() {
            try {
                const response = await fetch('/api/properties');
                const data = await response.json();
                
                if (data.success) {
                    properties = data.data;
                    
                    // Get featured properties
                    const featuredResponse = await fetch('/api/featured');
                    const featuredData = await featuredResponse.json();
                    
                    if (featuredData.success) {
                        featuredIds = featuredData.data.map(p => p.propref);
                        
                        // Add featured status to properties
                        properties = properties.map(property => ({
                            ...property,
                            isFeatured: featuredIds.includes(property.propref)
                        }));
                    }
                    
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
                
                const response = await fetch('/api/featured/toggle', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ propertyId })
                });
                
                const data = await response.json();
                if (data.success) {
                    showSuccess('Featured status updated successfully');
                    await loadProperties(); // Reload to reflect changes
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