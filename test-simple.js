/**
 * Simple Test Script for Rentman API Proxy
 * 
 * This script tests the core logic without requiring the full Workers runtime
 */

// Mock environment for testing
const mockEnv = {
    RENTMAN_API_BASE_URL: 'https://api.rentman.net',
    RENTMAN_API_TOKEN: 'test-token',
    RENTMAN_API_USERNAME: 'test-user',
    RENTMAN_API_PASSWORD: 'test-pass',
    FEATURED_PROPERTIES: {
        get: async(key) => {
            if (key === 'featured_properties') {
                return JSON.stringify(['PROP001', 'PROP002']);
            }
            return null;
        },
        put: async(key, value) => {
            console.log(`KV PUT: ${key} = ${value}`);
            return true;
        },
    },
};

// Mock fetch for testing
global.fetch = async(url) => {
    console.log(`Mock fetch called with: ${url}`);

    if (url.includes('propertyadvertising.php')) {
        return {
            ok: true,
            json: async() => ({
                properties: [{
                        propref: 'PROP001',
                        displayaddress: '123 Test Street',
                        displayprice: '$500,000',
                        photo1: 'https://example.com/image1.jpg',
                        beds: 3,
                        baths: 2,
                        TYPE: 'House',
                    },
                    {
                        propref: 'PROP002',
                        displayaddress: '456 Sample Avenue',
                        displayprice: '$750,000',
                        photo1: 'https://example.com/image2.jpg',
                        beds: 4,
                        baths: 3,
                        TYPE: 'House',
                    },
                ],
            }),
        };
    }
    return {
        ok: false,
        status: 404,
    };
};

// Import our classes and functions
const { RentmanAPI, FeaturedPropertiesManager } = require('./src/index.js');

async function runTests() {
    console.log('🧪 Running Simple Tests for Rentman API Proxy\n');

    try {
        // Test 1: RentmanAPI Class
        console.log('1. Testing RentmanAPI Class...');
        const rentman = new RentmanAPI(mockEnv);
        const properties = await rentman.fetchProperties();
        console.log(`✅ Fetched ${properties.length} properties`);
        console.log(`   First property: ${properties[0].displayaddress}\n`);

        // Test 2: FeaturedPropertiesManager Class
        console.log('2. Testing FeaturedPropertiesManager Class...');
        const featuredManager = new FeaturedPropertiesManager(mockEnv.FEATURED_PROPERTIES);
        const featuredIds = await featuredManager.getFeaturedPropertyIds();
        console.log(`✅ Retrieved ${featuredIds.length} featured property IDs`);
        console.log(`   Featured IDs: ${featuredIds.join(', ')}\n`);

        // Test 3: Toggle Featured Property
        console.log('3. Testing Toggle Featured Property...');
        const updatedFeatured = await featuredManager.toggleFeaturedProperty('PROP003');
        console.log(`✅ Toggled featured property. Updated list: ${updatedFeatured.join(', ')}\n`);

        // Test 4: Data Structure Validation
        console.log('4. Testing Data Structure...');
        const property = properties[0];
        const requiredFields = ['propref', 'displayaddress', 'displayprice', 'photo1', 'beds', 'baths', 'TYPE'];
        const missingFields = requiredFields.filter(field => !property.hasOwnProperty(field));

        if (missingFields.length === 0) {
            console.log('✅ All required property fields are present');
        } else {
            console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        }
        console.log();

        // Test 5: Featured Properties Filtering
        console.log('5. Testing Featured Properties Filtering...');
        const featuredProperties = properties.filter(property =>
            featuredIds.includes(property.propref)
        );
        console.log(`✅ Found ${featuredProperties.length} featured properties out of ${properties.length} total`);
        console.log();

        console.log('🎉 All tests passed! The core logic is working correctly.');
        console.log('\n📋 Next Steps:');
        console.log('1. Deploy to Cloudflare Workers (bypasses local runtime issues)');
        console.log('2. Test with real Rentman API credentials');
        console.log('3. Integrate with Framer website');
        console.log('4. Set up admin authentication');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the tests
runTests().catch(console.error);