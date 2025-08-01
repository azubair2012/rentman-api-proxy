// Optimized Rentman API client with caching
import { CACHE_TTL, IMAGE_CACHE_TTL, PROPERTY_IMAGE_PREFIX, MEDIA_LIST_TTL } from '../utils/helpers';

class RentmanAPI {
    constructor(env) {
        this.baseUrl = env.RENTMAN_API_BASE_URL || 'https://www.rentman.online';
        this.token = env.RENTMAN_API_TOKEN ? decodeURIComponent(env.RENTMAN_API_TOKEN) : null;
        this.kv = env.FEATURED_PROPERTIES;
        
        // ✅ ADD: Request deduplication storage
        this.pendingRequests = new Map();
    }

    async fetchProperties() {
        const requestKey = 'properties';
        
        // ✅ NEW: Check for pending identical requests
        if (this.pendingRequests.has(requestKey)) {
            console.log('Deduplicating concurrent request for properties');
            return await this.pendingRequests.get(requestKey);
        }

        try {
            // Check cache first (existing logic)
            const cacheKey = 'properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log(`Found ${cached.length} cached properties, enhancing with images`);
                // ✅ NEW: Enhance cached properties with images
                return await this.enhancePropertiesWithImages(cached);
            }

            // ✅ NEW: Create and store the fetch promise
            const fetchPromise = this.performActualFetch(requestKey);
            this.pendingRequests.set(requestKey, fetchPromise);

            const result = await fetchPromise;
            return result;

        } finally {
            // ✅ NEW: Clean up completed request
            this.pendingRequests.delete(requestKey);
        }
    }

    // ✅ NEW: Separate method for actual fetching
    async performActualFetch(requestKey) {
        try {
            // ✅ PHASE 2: Get stored ETag for conditional requests
            const etagKey = `etag_${requestKey}`;
            const storedETag = await this.kv.get(etagKey);
            
            // Fetch with timeout (existing logic)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const headers = { 'Accept': 'application/json' };
            
            // ✅ PHASE 2: Add If-None-Match header for conditional requests
            if (storedETag) {
                headers['If-None-Match'] = storedETag;
                console.log(`Using conditional request with ETag: ${storedETag}`);
            }

            const url = `${this.baseUrl}/propertyadvertising.php?token=${this.token}`;
            const response = await fetch(url, {
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // ✅ PHASE 2: Handle 304 Not Modified responses
            if (response.status === 304) {
                console.log('Content not modified, using existing cache');
                const cacheKey = 'properties_cache';
                const cached = await this.kv.get(cacheKey, 'json');
                if (cached) {
                    return await this.enhancePropertiesWithImages(cached);
                }
                // If no cache exists, fall through to error handling
            }

            if (!response.ok) {
                throw new Error(`Rentman API error: ${response.status}`);
            }

            const data = await response.json();
            const properties = data || [];

            // ✅ PHASE 2: Store ETag for future conditional requests
            const responseETag = response.headers.get('etag');
            if (responseETag) {
                const etagKey = `etag_${requestKey}`;
                await this.kv.put(etagKey, responseETag, { expirationTtl: CACHE_TTL * 2 }); // Store ETag longer than cache
                console.log(`Stored ETag for future conditional requests: ${responseETag}`);
            }

            // ✅ NEW: Use separate caching strategy
            await this.cachePropertiesAndImages(properties);

            console.log(`Fetched and cached ${properties.length} properties with separate image storage`);
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

            // ✅ PHASE 2: Cache media list with smart TTL (30 minutes)
            await this.kv.put(cacheKey, JSON.stringify(mediaList), { expirationTtl: MEDIA_LIST_TTL });

            return mediaList;
        } catch (error) {
            console.error('Error fetching property media:', error);
            throw error;
        }
    }

    // ✅ NEW: Separate caching for properties and images
    async cachePropertiesAndImages(properties) {
        try {
            // Cache lightweight property data without images
            const propertiesWithoutImages = properties.map(property => {
                const { photo1binary, ...propertyWithoutImage } = property;
                return propertyWithoutImage;
            });
            
            // Cache property metadata
            await this.kv.put('properties_cache', JSON.stringify(propertiesWithoutImages), {
                expirationTtl: CACHE_TTL
            });

            // Cache images separately with longer TTL
            const imagePromises = properties
                .filter(property => property.photo1binary)
                .map(property => 
                    this.kv.put(
                        `${PROPERTY_IMAGE_PREFIX}${property.propref}`,
                        property.photo1binary,
                        { expirationTtl: IMAGE_CACHE_TTL }
                    )
                );

            await Promise.all(imagePromises);
            console.log(`Cached ${properties.length} properties and ${imagePromises.length} images separately`);
            
        } catch (error) {
            console.error('Error in separate caching:', error);
            // ✅ FALLBACK: Cache everything together if separation fails
            await this.kv.put('properties_cache', JSON.stringify(properties), {
                expirationTtl: CACHE_TTL
            });
        }
    }

    // ✅ NEW: Enhance cached properties with images
    async enhancePropertiesWithImages(properties) {
        try {
            // Parallel image fetching for better performance
            const enhancedProperties = await Promise.all(
                properties.map(async property => {
                    try {
                        const imageData = await this.kv.get(`${PROPERTY_IMAGE_PREFIX}${property.propref}`);
                        return {
                            ...property,
                            photo1binary: imageData || null
                        };
                    } catch (error) {
                        console.warn(`Failed to load image for property ${property.propref}:`, error);
                        return {
                            ...property,
                            photo1binary: null
                        };
                    }
                })
            );

            return enhancedProperties;
        } catch (error) {
            console.error('Error enhancing properties with images:', error);
            // ✅ FALLBACK: Return properties without images
            return properties;
        }
    }

    // ✅ PHASE 2: Cache warming functionality
    async warmCache() {
        try {
            console.log('Starting cache warm-up...');
            
            // Warm properties cache
            await this.fetchProperties();
            
            // Warm featured properties cache
            const FeaturedPropertiesManager = (await import('./FeaturedPropertiesManager.js')).FeaturedPropertiesManager;
            const featuredManager = new FeaturedPropertiesManager(this.kv);
            await featuredManager.getFeaturedPropertyIds();
            
            console.log('Cache warm-up completed successfully');
            return { success: true, message: 'Cache warmed successfully' };
        } catch (error) {
            console.error('Cache warm-up failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ✅ PHASE 2: Background cache refresh
    async scheduleBackgroundRefresh() {
        try {
            // Check if cache is close to expiration (within 1 minute)
            const cacheMetadata = await this.kv.getWithMetadata('properties_cache');
            if (cacheMetadata.metadata) {
                const expirationTime = cacheMetadata.metadata.expiration * 1000; // Convert to milliseconds
                const now = Date.now();
                const timeToExpiration = expirationTime - now;
                
                // If cache expires within 60 seconds, refresh it
                if (timeToExpiration < 60000 && timeToExpiration > 0) {
                    console.log('Cache expiring soon, triggering background refresh...');
                    // Don't await - let it run in background
                    this.performActualFetch('properties').catch(error => 
                        console.error('Background cache refresh failed:', error)
                    );
                }
            }
        } catch (error) {
            console.error('Background refresh check failed:', error);
        }
    }
}

export { RentmanAPI };