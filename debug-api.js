/**
 * Debug Script for Rentman API Proxy
 * 
 * This script tests the deployed API to identify the 500 error
 */

const API_BASE = 'https://rentman-api-proxy.londonmove.workers.dev';

async function testAPI() {
    console.log('🔍 Debugging Rentman API Proxy\n');
    console.log(`API Base: ${API_BASE}\n`);

    try {
        // Test 1: Root endpoint
        console.log('1. Testing root endpoint...');
        const rootResponse = await fetch(`${API_BASE}/`);
        console.log(`   Status: ${rootResponse.status}`);
        console.log(`   Content-Type: ${rootResponse.headers.get('content-type')}`);

        const rootText = await rootResponse.text();
        console.log(`   Full Response:`);
        console.log(rootText);
        console.log();

        // Test 2: Properties endpoint
        console.log('2. Testing properties endpoint...');
        const propsResponse = await fetch(`${API_BASE}/api/properties`);
        console.log(`   Status: ${propsResponse.status}`);
        console.log(`   Content-Type: ${propsResponse.headers.get('content-type')}`);

        const propsText = await propsResponse.text();
        console.log(`   Response (first 500 chars): ${propsText.substring(0, 500)}...`);
        console.log();

        // Test 3: Admin properties endpoint (the one causing 500)
        console.log('3. Testing admin properties endpoint...');
        const adminResponse = await fetch(`${API_BASE}/api/admin/properties`);
        console.log(`   Status: ${adminResponse.status}`);
        console.log(`   Content-Type: ${adminResponse.headers.get('content-type')}`);

        const adminText = await adminResponse.text();
        console.log(`   Response (first 500 chars): ${adminText.substring(0, 500)}...`);
        console.log();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug
testAPI().catch(console.error);