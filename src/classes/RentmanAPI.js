// Optimized Rentman API client with caching
import { CACHE_TTL, IMAGE_CACHE_TTL, PROPERTY_IMAGE_PREFIX } from '../utils/helpers';

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
            // Fetch with timeout (existing logic)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

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

            // Cache the media list
            await this.kv.put(cacheKey, JSON.stringify(mediaList), { expirationTtl: CACHE_TTL });

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
}

export { RentmanAPI };