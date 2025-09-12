// Optimized Rentman API client with caching
import { CACHE_TTL, IMAGE_CACHE_TTL, PROPERTY_IMAGE_PREFIX, MEDIA_LIST_TTL, isValidBase64Image, getImageMetadata } from '../utils/helpers.js';

class RentmanAPI {
    constructor(env) {
        this.baseUrl = env.RENTMAN_API_BASE_URL || 'https://www.rentman.online';
        this.token = env.RENTMAN_API_TOKEN ? decodeURIComponent(env.RENTMAN_API_TOKEN) : null;
        this.kv = env.FEATURED_PROPERTIES;
        
        // ✅ ADD: Request deduplication storage
        this.pendingRequests = new Map();
    }

    async fetchProperties() {
        try {
            // Check cache first
            const cacheKey = 'properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log(`Returning ${cached.length} cached properties`);
                return cached;
            }

            // Fetch fresh data
            console.log('Fetching fresh properties from Rentman API...');
            const url = `${this.baseUrl}/propertyadvertising.php?token=${this.token}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                headers: { 
                    'Accept': 'application/json',
                    'Accept-Encoding': 'identity', // Disable gzip compression
                    'User-Agent': 'Rentman-API-Proxy/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Rentman API error: ${response.status} ${response.statusText}`);
            }

            const properties = await response.json();
            
            // Cache the data
            await this.kv.put(cacheKey, JSON.stringify(properties), {
                expirationTtl: CACHE_TTL
            });

            console.log(`Fetched and cached ${properties.length} properties`);
            return properties;

        } catch (error) {
            console.error('Error fetching properties:', error);
            throw error;
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
                headers: {
                    ...headers,
                    'Accept-Encoding': 'identity', // Disable gzip compression
                    'User-Agent': 'Rentman-API-Proxy/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // ✅ PHASE 2: Handle 304 Not Modified responses
            if (response.status === 304) {
                console.log('Content not modified, using existing cache');
                const cacheKey = 'properties_cache';
                const cached = await this.kv.get(cacheKey, 'json');
                if (cached) {
                    // ✅ FIXED: Use new enhanced properties system
                    return await this.getEnhancedProperties(cached);
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

            // According to API docs, property media uses token as header, not query param
            const url = `${this.baseUrl}/propertymedia.php?propref=${encodeURIComponent(propref)}`;
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
                headers: { 
                    'token': this.token,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'identity', // Disable gzip compression
                    'User-Agent': 'Rentman-API-Proxy/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Media API error: ${response.status} ${response.statusText}`);
            }

            const mediaList = await response.json();
            console.log(`Fetched ${mediaList.length} media items for property ${propref}`);

            // ✅ PHASE 2: Cache media list with smart TTL (30 minutes)
            await this.kv.put(cacheKey, JSON.stringify(mediaList), { expirationTtl: MEDIA_LIST_TTL });

            return mediaList;
        } catch (error) {
            console.error('Error fetching property media:', error);
            throw error;
        }
    }

    // ✅ ENHANCED: Comprehensive caching for properties and ALL images
    async cachePropertiesAndImages(properties) {
        try {
            // Cache lightweight property data without ANY images
            const propertiesWithoutImages = properties.map(property => {
                const { 
                    photo1binary, photo2binary, photo3binary, photo4binary, photo5binary,
                    photo6binary, photo7binary, photo8binary, photo9binary,
                    floorplanbinary, epcbinary,
                    ...propertyWithoutImage 
                } = property;
                return propertyWithoutImage;
            });
            
            // Cache property metadata
            await this.kv.put('properties_cache', JSON.stringify(propertiesWithoutImages), {
                expirationTtl: CACHE_TTL
            });

            // ✅ ENHANCED: Cache ALL images separately with longer TTL
            const allImagePromises = [];
            
            properties.forEach(property => {
                const propref = property.propref;
                
                // ✅ ENHANCED: Cache all photo fields with validation
                ['photo1binary', 'photo2binary', 'photo3binary', 'photo4binary', 'photo5binary',
                 'photo6binary', 'photo7binary', 'photo8binary', 'photo9binary'].forEach((photoField, index) => {
                    if (property[photoField]) {
                        // Validate image before caching
                        if (isValidBase64Image(property[photoField])) {
                            const metadata = getImageMetadata(property[photoField]);
                            console.log(`Caching ${photoField} for ${propref}: ${metadata.sizeFormatted}`);
                            
                            allImagePromises.push(
                                this.kv.put(
                                    `${PROPERTY_IMAGE_PREFIX}${propref}_photo${index + 1}`,
                                    property[photoField],
                                    { expirationTtl: IMAGE_CACHE_TTL }
                                )
                            );
                        } else {
                            console.warn(`Invalid image data for ${propref} ${photoField}, skipping cache`);
                        }
                    }
                });
                
                // ✅ ENHANCED: Cache floor plan with validation
                if (property.floorplanbinary) {
                    if (isValidBase64Image(property.floorplanbinary)) {
                        const metadata = getImageMetadata(property.floorplanbinary);
                        console.log(`Caching floor plan for ${propref}: ${metadata.sizeFormatted}`);
                        
                        allImagePromises.push(
                            this.kv.put(
                                `${PROPERTY_IMAGE_PREFIX}${propref}_floorplan`,
                                property.floorplanbinary,
                                { expirationTtl: IMAGE_CACHE_TTL }
                            )
                        );
                    } else {
                        console.warn(`Invalid floor plan data for ${propref}, skipping cache`);
                    }
                }
                
                // ✅ ENHANCED: Cache EPC certificate with validation
                if (property.epcbinary) {
                    if (isValidBase64Image(property.epcbinary)) {
                        const metadata = getImageMetadata(property.epcbinary);
                        console.log(`Caching EPC certificate for ${propref}: ${metadata.sizeFormatted}`);
                        
                        allImagePromises.push(
                            this.kv.put(
                                `${PROPERTY_IMAGE_PREFIX}${propref}_epc`,
                                property.epcbinary,
                                { expirationTtl: IMAGE_CACHE_TTL }
                            )
                        );
                    } else {
                        console.warn(`Invalid EPC certificate data for ${propref}, skipping cache`);
                    }
                }

                // ✅ NEW: Cache individual property details for faster single-property lookups
                const individualCacheKey = `property_detail_${propref}`;
                allImagePromises.push(
                    this.kv.put(individualCacheKey, JSON.stringify(propertyWithoutImages.find(p => p.propref === propref)), {
                        expirationTtl: IMAGE_CACHE_TTL // Use longer TTL for individual property details
                    })
                );
            });

            await Promise.all(allImagePromises);
            console.log(`Enhanced caching: ${properties.length} properties, ${allImagePromises.length - properties.length} images, ${properties.length} individual property details`);
            
        } catch (error) {
            console.error('Error in enhanced caching:', error);
            // ✅ FALLBACK: Cache everything together if enhanced caching fails
            await this.kv.put('properties_cache', JSON.stringify(properties), {
                expirationTtl: CACHE_TTL
            });
        }
    }

    // ✅ NEW: Get enhanced properties with comprehensive image reconstruction
    async getEnhancedProperties(properties) {
        try {
            console.log(`Enhancing ${properties.length} properties with images...`);
            
            // Parallel image reconstruction for all properties
            const enhancedProperties = await Promise.all(
                properties.map(property => this.reconstructPropertyImages(property))
            );

            const imageCount = enhancedProperties.reduce((count, property) => {
                const imageFields = Object.keys(property).filter(key => key.includes('binary'));
                return count + imageFields.length;
            }, 0);

            console.log(`Enhanced ${enhancedProperties.length} properties with ${imageCount} total images`);
            return enhancedProperties;
            
        } catch (error) {
            console.error('Error enhancing properties with images:', error);
            // ✅ FALLBACK: Return properties without images but log the failure
            console.warn('Falling back to properties without images due to enhancement failure');
            return properties;
        }
    }

    // ✅ NEW: Fetch and process additional property media into expected binary format
    async fetchAndProcessPropertyMedia(propref) {
        try {
            // Check cache first
            const cacheKey = `additional_media_${propref}`;
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log(`Using cached additional media for property ${propref}`);
                return cached;
            }

            // Add timeout for media fetching to prevent hanging
            const mediaFetchPromise = this.fetchPropertyMedia(propref);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Media fetch timeout')), 8000) // 8 second timeout
            );

            const mediaList = await Promise.race([mediaFetchPromise, timeoutPromise]);
            
            if (!mediaList || mediaList.length === 0) {
                console.log(`No additional media found for property ${propref}`);
                return null;
            }

            const additionalMedia = {};
            let processedCount = 0;

            // Process each media item with limits
            for (const mediaItem of mediaList.slice(0, 10)) { // Limit to 10 media items max
                if (!mediaItem.base64data || !mediaItem.filename) {
                    continue;
                }

                const { filename, base64data, imgorder } = mediaItem;
                
                // Determine media type based on imgorder and filename
                if (imgorder === '9000' || filename.toLowerCase().includes('epc')) {
                    // EPC Certificate
                    additionalMedia.epcbinary = base64data;
                    processedCount++;
                } else if (imgorder === '9005' || filename.toLowerCase().includes('floorplan')) {
                    // Floor Plan  
                    additionalMedia.floorplanbinary = base64data;
                    processedCount++;
                } else {
                    // Regular photos - map to photo2binary through photo9binary
                    // Skip photo1 as it's already handled separately
                    if (!filename.toLowerCase().includes('photo1')) {
                        // Find next available photo slot
                        for (let i = 2; i <= 9; i++) {
                            const photoField = `photo${i}binary`;
                            if (!additionalMedia[photoField]) {
                                additionalMedia[photoField] = base64data;
                                processedCount++;
                                break;
                            }
                        }
                    }
                }

                // Stop processing if we've reached reasonable limits
                if (processedCount >= 10) {
                    break;
                }
            }

            // Cache the processed media for 1 hour, even if empty
            try {
                await this.kv.put(cacheKey, JSON.stringify(additionalMedia), { 
                    expirationTtl: 3600 // 1 hour cache for additional media
                });
            } catch (cacheError) {
                console.warn(`Failed to cache additional media for ${propref}:`, cacheError);
                // Continue without caching
            }

            console.log(`Processed ${processedCount} additional media items for property ${propref}`);
            return Object.keys(additionalMedia).length > 0 ? additionalMedia : null;

        } catch (error) {
            console.error(`Error fetching additional media for property ${propref}:`, error);
            
            // Cache empty result to prevent repeated failures
            try {
                const cacheKey = `additional_media_${propref}`;
                await this.kv.put(cacheKey, JSON.stringify({}), { 
                    expirationTtl: 300 // 5 minute cache for failures
                });
            } catch (cacheError) {
                // Ignore cache errors
            }
            
            return null;
        }
    }

    // ✅ NEW: Get individual property details with comprehensive caching
    async getPropertyDetails(propertyId) {
        try {
            const cacheKey = `property_detail_${propertyId}`;
            
            // Check if individual property details are cached
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log(`Property detail cache hit for: ${propertyId}`);
                
                // Reconstruct property with cached images
                const propertyWithImages = await this.reconstructPropertyImages(cached);
                return propertyWithImages;
            }
            
            console.log(`Property detail cache miss for: ${propertyId}, checking main cache...`);
            
            // Fallback: Try to find in main properties cache
            const allProperties = await this.kv.get('properties_cache', 'json');
            if (allProperties) {
                const foundProperty = allProperties.find(p => p.propref === propertyId);
                if (foundProperty) {
                    console.log(`Found property ${propertyId} in main cache`);
                    const propertyWithImages = await this.reconstructPropertyImages(foundProperty);
                    
                    // Cache individual property for future requests
                    await this.kv.put(cacheKey, JSON.stringify(foundProperty), {
                        expirationTtl: IMAGE_CACHE_TTL
                    });
                    
                    return propertyWithImages;
                }
            }
            
            // Last resort: Property not found in any cache
            console.log(`Property ${propertyId} not found in any cache`);
            throw new Error(`Property ${propertyId} not found in cache`);
            
        } catch (error) {
            console.error(`Error fetching property details for ${propertyId}:`, error);
            throw error;
        }
    }

    // ✅ ENHANCED: Reconstruct property with cached images + error handling + progressive loading
    async reconstructPropertyImages(propertyMetadata) {
        try {
            const propref = propertyMetadata.propref;
            const reconstructed = { ...propertyMetadata };
            
            // ✅ PROGRESSIVE LOADING: Prioritize main photo, then load others
            const mainPhotoPromise = this.kv.get(`${PROPERTY_IMAGE_PREFIX}${propref}_photo1`)
                .then(data => ({ field: 'photo1binary', data, priority: 1 }))
                .catch(() => ({ field: 'photo1binary', data: null, priority: 1 }));
            
            // Other photos - lower priority
            const otherPhotoPromises = [];
            for (let i = 2; i <= 9; i++) {
                otherPhotoPromises.push(
                    this.kv.get(`${PROPERTY_IMAGE_PREFIX}${propref}_photo${i}`)
                        .then(data => ({ field: `photo${i}binary`, data, priority: 2 }))
                        .catch(() => ({ field: `photo${i}binary`, data: null, priority: 2 }))
                );
            }
            
            // Special documents - medium priority
            const documentPromises = [
                this.kv.get(`${PROPERTY_IMAGE_PREFIX}${propref}_floorplan`)
                    .then(data => ({ field: 'floorplanbinary', data, priority: 1.5 }))
                    .catch(() => ({ field: 'floorplanbinary', data: null, priority: 1.5 })),
                this.kv.get(`${PROPERTY_IMAGE_PREFIX}${propref}_epc`)
                    .then(data => ({ field: 'epcbinary', data, priority: 1.5 }))
                    .catch(() => ({ field: 'epcbinary', data: null, priority: 1.5 }))
            ];
            
            // ✅ PARALLEL LOADING: Get main photo first, others in parallel
            const mainPhoto = await mainPhotoPromise;
            const [otherPhotos, documents] = await Promise.all([
                Promise.all(otherPhotoPromises),
                Promise.all(documentPromises)
            ]);
            
            // Combine all results
            const allResults = [mainPhoto, ...otherPhotos, ...documents];
            
            // Add images back to property data with error tracking
            let imageCount = 0;
            let missingImages = [];
            
            allResults.forEach(result => {
                if (result.data) {
                    reconstructed[result.field] = result.data;
                    imageCount++;
                } else {
                    missingImages.push(result.field);
                }
            });
            
            // ✅ ENHANCED LOGGING: Track performance and missing images
            if (missingImages.length > 0) {
                console.log(`Property ${propref}: ${imageCount} images loaded, ${missingImages.length} missing:`, missingImages);
            } else {
                console.log(`Property ${propref}: Successfully loaded all ${imageCount} images`);
            }
            
            // Add image metadata for frontend
            reconstructed.totalImages = imageCount;
            reconstructed.missingImages = missingImages.length;
            
            return reconstructed;
            
        } catch (error) {
            console.error(`Error reconstructing images for property ${propertyMetadata.propref}:`, error);
            // ✅ GRACEFUL FALLBACK: Return property with error info but don't crash
            return {
                ...propertyMetadata,
                totalImages: 0,
                missingImages: 'all',
                imageError: error.message
            };
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
            const featuredManager = new FeaturedPropertiesManager(this.kv, this.env);
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