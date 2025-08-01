/**
 * Test Rentman API directly with different token methods
 */

const TOKEN_ENCODED = 'LRnFpm0C5d81s1S1PuCNfQuVj3wSGbWgd%2BZJwrmZE1bbo8mEdr9p4t%2FZ8jMoldu0PosD3sJbNDuHO7OwDn%2FvxPwQv73AEehgp8Hjb0%2FB%2BAPYpQt%2Bcc55bA2Z2ye1VwaqDCZnmcBqpd4%3D';
const TOKEN_DECODED = decodeURIComponent(TOKEN_ENCODED);
const BASE_URL = 'https://www.rentman.online/propertyadvertising.php';

async function tryRequest({ label, url, headers }) {
    console.log(`\n=== ${label} ===`);
    console.log(`URL: ${url}`);
    console.log(`Headers:`, headers);
    try {
        const response = await fetch(url, { headers });
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        const text = await response.text();
        console.log(`Response (first 1000 chars):\n${text.substring(0, 1000)}`);
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
            console.log('❌ Response is HTML, not JSON');
        } else {
            try {
                const json = JSON.parse(text);
                console.log('✅ JSON parsed successfully');
                if (Array.isArray(json)) {
                    console.log(`Array length: ${json.length}`);
                }
            } catch (e) {
                console.log('❌ Not valid JSON:', e.message);
            }
        }
    } catch (err) {
        console.error('❌ Network error:', err.message);
    }
}

async function testAll() {
    // 1. Token as query param (encoded)
    await tryRequest({
        label: 'Token as query param (encoded)',
        url: `${BASE_URL}?token=${TOKEN_ENCODED}`,
        headers: { 'Accept': 'application/json' }
    });

    // 2. Token as query param (decoded)
    await tryRequest({
        label: 'Token as query param (decoded)',
        url: `${BASE_URL}?token=${TOKEN_DECODED}`,
        headers: { 'Accept': 'application/json' }
    });

    // 3. Token as header (encoded)
    await tryRequest({
        label: 'Token as header (encoded)',
        url: BASE_URL,
        headers: { 'Accept': 'application/json', 'token': TOKEN_ENCODED }
    });

    // 4. Token as header (decoded)
    await tryRequest({
        label: 'Token as header (decoded)',
        url: BASE_URL,
        headers: { 'Accept': 'application/json', 'token': TOKEN_DECODED }
    });
}

testAll().catch(console.error);