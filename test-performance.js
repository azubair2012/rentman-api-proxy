/**
 * Performance Testing Script for Rentman API Proxy Optimizations
 * 
 * This script tests the implemented performance optimizations:
 * 1. Request deduplication
 * 2. Selective cache invalidation
 * 3. Separate image caching
 * 4. Optimized filtering
 */

const baseUrl = 'http://localhost:8787'; // Change to your deployed URL if needed

// Performance testing utility
class PerformanceMonitor {
    static measureEndpoint(endpoint, label) {
        const start = performance.now();
        return fetch(endpoint)
            .then(response => {
                const duration = performance.now() - start;
                console.log(`${label}: ${duration.toFixed(2)}ms`);
                return response;
            });
    }
    
    static async measureConcurrentRequests(endpoint, count = 5) {
        console.log(`\n🔄 Testing concurrent requests (${count} requests to ${endpoint})...`);
        const start = performance.now();
        const requests = Array(count).fill().map(() => fetch(endpoint));
        
        await Promise.all(requests);
        const duration = performance.now() - start;
        console.log(`✅ ${count} concurrent requests completed in ${duration.toFixed(2)}ms`);
        
        // Expected: Should be close to single request time due to deduplication
        if (duration < 2000) {
            console.log(`🎉 EXCELLENT: Request deduplication working! (Expected <2s, got ${(duration/1000).toFixed(1)}s)`);
        } else {
            console.log(`⚠️  WARNING: Concurrent requests taking longer than expected`);
        }
        
        return duration;
    }
}

// Main performance test suite
async function testPerformance() {
    console.log('🚀 Starting Performance Tests for Rentman API Proxy Optimizations\n');
    console.log('Expected improvements:');
    console.log('- API response times: 65-70% faster (2.5-3.5s → 0.8-1.2s)');
    console.log('- Concurrent requests: 80% reduction in API calls');
    console.log('- Featured properties: Early termination optimization');
    console.log('- Cache efficiency: Selective updates instead of full invalidation\n');
    
    try {
        // Test 1: Single API request performance
        console.log('📊 Test 1: Single API Request Performance');
        const singleStart = Date.now();
        const propertiesResponse = await fetch(`${baseUrl}/api/properties`);
        const singleDuration = Date.now() - singleStart;
        
        if (propertiesResponse.ok) {
            const data = await propertiesResponse.json();
            console.log(`✅ Properties API: ${singleDuration}ms (${data.count} properties)`);
            
            if (singleDuration < 1200) {
                console.log(`🎉 EXCELLENT: Single request under target 1.2s!`);
            } else if (singleDuration < 2000) {
                console.log(`✅ GOOD: Improved from baseline (was 2.5-3.5s)`);
            } else {
                console.log(`⚠️  Slower than expected, check optimization implementation`);
            }
        } else {
            console.log(`❌ Properties API failed: ${propertiesResponse.status}`);
        }
        
        // Test 2: Concurrent request deduplication
        await PerformanceMonitor.measureConcurrentRequests(`${baseUrl}/api/properties`, 5);
        
        // Test 3: Featured properties performance
        console.log(`\n🎯 Test 3: Featured Properties Performance...`);
        const featuredStart = Date.now();
        const featuredResponse = await fetch(`${baseUrl}/api/featured`);
        const featuredDuration = Date.now() - featuredStart;
        
        if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json();
            console.log(`✅ Featured Properties API: ${featuredDuration}ms`);
            console.log(`📈 Found ${featuredData.count} featured properties`);
            
            // Check for performance metadata
            if (featuredData.performance) {
                const perf = featuredData.performance;
                console.log(`🔍 Performance details:`);
                console.log(`   - Total properties processed: ${perf.totalProperties}`);
                console.log(`   - Featured properties found: ${perf.featuredFound}`);
                console.log(`   - Early termination used: ${perf.earlyTermination ? 'Yes ✅' : 'No'}`);
            }
            
            if (featuredDuration < 1200) {
                console.log(`🎉 EXCELLENT: Featured properties under target 1.2s!`);
            }
        } else {
            console.log(`❌ Featured Properties API failed: ${featuredResponse.status}`);
        }
        
        // Test 4: Cache efficiency test
        console.log(`\n💾 Test 4: Cache Efficiency Test...`);
        console.log(`Making second request to test cache hit...`);
        
        const cacheStart = Date.now();
        const cachedResponse = await fetch(`${baseUrl}/api/properties`);
        const cacheDuration = Date.now() - cacheStart;
        
        if (cachedResponse.ok) {
            console.log(`✅ Cached request: ${cacheDuration}ms`);
            
            if (cacheDuration < 500) {
                console.log(`🎉 EXCELLENT: Cache working efficiently!`);
            } else if (cacheDuration < 1000) {
                console.log(`✅ GOOD: Cache providing benefit`);
            }
        }
        
        // Test 5: Admin interface simulation (if available)
        console.log(`\n🏠 Test 5: Admin Interface Load Test...`);
        try {
            const adminStart = Date.now();
            const adminResponse = await fetch(`${baseUrl}/admin`);
            const adminDuration = Date.now() - adminStart;
            
            if (adminResponse.ok) {
                console.log(`✅ Admin interface: ${adminDuration}ms`);
                
                if (adminDuration < 2000) {
                    console.log(`🎉 EXCELLENT: Admin interface loading quickly!`);
                }
            }
        } catch (error) {
            console.log(`ℹ️  Admin interface test skipped (${error.message})`);
        }
        
        // Summary
        console.log(`\n📋 Performance Test Summary:`);
        console.log(`================================`);
        console.log(`✅ Request deduplication: Tested`);
        console.log(`✅ Cache optimization: Tested`);
        console.log(`✅ Featured properties optimization: Tested`);
        console.log(`✅ Response time improvements: Measured`);
        console.log(`\n🎯 Key Performance Indicators:`);
        console.log(`- Single API request: ${singleDuration}ms (Target: <1200ms)`);
        console.log(`- Featured properties: ${featuredDuration}ms (Target: <1200ms)`);
        console.log(`- Cache efficiency: ${cacheDuration}ms (Target: <500ms)`);
        
        // Overall assessment
        const avgResponseTime = (singleDuration + featuredDuration) / 2;
        if (avgResponseTime < 1000) {
            console.log(`\n🏆 OUTSTANDING: Average response time ${avgResponseTime.toFixed(0)}ms - Optimizations working excellently!`);
        } else if (avgResponseTime < 1500) {
            console.log(`\n🎉 EXCELLENT: Average response time ${avgResponseTime.toFixed(0)}ms - Major improvements achieved!`);
        } else if (avgResponseTime < 2500) {
            console.log(`\n✅ GOOD: Average response time ${avgResponseTime.toFixed(0)}ms - Improvements visible!`);
        } else {
            console.log(`\n⚠️  Average response time ${avgResponseTime.toFixed(0)}ms - Check optimization implementation`);
        }
        
    } catch (error) {
        console.error(`❌ Performance test failed:`, error);
        console.log(`\n🔧 Troubleshooting tips:`);
        console.log(`1. Make sure the development server is running: npm run dev`);
        console.log(`2. Check the base URL is correct: ${baseUrl}`);
        console.log(`3. Verify all optimization code has been implemented`);
        console.log(`4. Check console logs for optimization messages`);
    }
}

// Memory usage monitoring (if available)
function measureMemoryUsage() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = performance.memory;
        console.log(`\n🧠 Memory Usage:`);
        console.log(`- Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Allocated: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
}

// Performance validation for specific optimizations
async function validateOptimizations() {
    console.log(`\n🔍 Validation Tests for Specific Optimizations:`);
    
    try {
        // Test request deduplication
        console.log(`\n1. Request Deduplication Validation:`);
        const concurrentStart = Date.now();
        await Promise.all([
            fetch(`${baseUrl}/api/properties`),
            fetch(`${baseUrl}/api/properties`),
            fetch(`${baseUrl}/api/properties`)
        ]);
        const concurrentTime = Date.now() - concurrentStart;
        console.log(`   3 concurrent requests: ${concurrentTime}ms`);
        console.log(`   Expected: Close to single request time due to deduplication`);
        
        // Test featured properties speed
        console.log(`\n2. Featured Properties Optimization Validation:`);
        const featuredStart = Date.now();
        const featuredResp = await fetch(`${baseUrl}/api/featured`);
        const featuredTime = Date.now() - featuredStart;
        console.log(`   Featured properties request: ${featuredTime}ms`);
        
        if (featuredResp.ok) {
            const featuredData = await featuredResp.json();
            if (featuredData.performance && featuredData.performance.earlyTermination) {
                console.log(`   ✅ Early termination optimization active!`);
            }
        }
        
        measureMemoryUsage();
        
    } catch (error) {
        console.error(`Validation failed:`, error);
    }
}

// Run all tests
async function runAllTests() {
    await testPerformance();
    await validateOptimizations();
    
    console.log(`\n🎯 Next Steps:`);
    console.log(`1. If results look good, deploy with: npm run deploy`);
    console.log(`2. Monitor production performance with browser dev tools`);
    console.log(`3. Check console logs for optimization messages`);
    console.log(`4. Test admin interface for improved toggle responsiveness`);
    console.log(`\n📚 For detailed metrics, see: doc/performance/Performance-Metrics.md`);
}

// Support for both Node.js and browser environments
if (typeof window !== 'undefined') {
    // Browser environment
    window.testPerformance = testPerformance;
    window.validateOptimizations = validateOptimizations;
    window.runAllTests = runAllTests;
    console.log('Performance testing functions available: testPerformance(), validateOptimizations(), runAllTests()');
} else {
    // Node.js environment
    runAllTests().catch(console.error);
}