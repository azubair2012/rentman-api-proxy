import { RentmanAPI } from '../classes/RentmanAPI.js';
import { ImageProcessor, selectOptimalFormat } from '../classes/ImageProcessor.js';

// Image endpoint handler
async function handleImageRequest(request, env, ctx) {
    try {
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        
        // Parse URL: /api/images/{propref}/{variant?}/{format?}
        if (pathSegments[0] !== 'api' || pathSegments[1] !== 'images') {
            return new Response('Not Found', { status: 404 });
        }

        const propref = pathSegments[2];
        const variant = pathSegments[3] || 'medium';
        const requestedFormat = pathSegments[4] || 'auto';

        if (!propref) {
            return new Response('Property reference required', { status: 400 });
        }

        // Validate variant
        const validVariants = ['thumbnail', 'medium', 'full', 'placeholder'];
        if (!validVariants.includes(variant)) {
            return new Response(`Invalid variant. Must be one of: ${validVariants.join(', ')}`, { status: 400 });
        }

        // Get photo index from query params (default to 1)
        const photoIndex = parseInt(url.searchParams.get('photo') || '1');
        if (photoIndex < 1 || photoIndex > 9) {
            return new Response('Photo index must be between 1 and 9', { status: 400 });
        }

        // Determine optimal format based on Accept header
        const acceptHeader = request.headers.get('Accept') || '';
        const userAgent = request.headers.get('User-Agent') || '';
        const format = requestedFormat === 'auto' ? 
            selectOptimalFormat(acceptHeader, userAgent) : 
            requestedFormat;

        // Generate cache key
        const cacheKey = ImageProcessor.getCacheKey(propref, variant, format, photoIndex);
        
        // Check cache first
        const cached = await env.FEATURED_PROPERTIES.get(cacheKey, 'arrayBuffer');
        if (cached) {
            return new Response(cached, {
                headers: {
                    'Content-Type': `image/${format}`,
                    'Cache-Control': 'public, max-age=3600',
                    'ETag': `\"${cacheKey}\"`,
                    'X-Cache-Status': 'HIT'
                }
            });
        }

        // Get property data from main properties list (same as API response)
        const rentmanAPI = new RentmanAPI(env);
        const allProperties = await rentmanAPI.fetchProperties();
        const propertyData = allProperties.find(p => p.propref == propref);
        
        if (!propertyData) {
            return new Response('Property not found', { status: 404 });
        }

        // Get the specific photo
        const photoField = `photo${photoIndex}binary`;
        const base64Data = propertyData[photoField];
        
        if (!base64Data) {
            // Return placeholder if no image available
            if (variant === 'placeholder') {
                const placeholderData = ImageProcessor.generateBlurPlaceholder('');
                return new Response(placeholderData, {
                    headers: {
                        'Content-Type': 'text/plain',
                        'Cache-Control': 'public, max-age=86400'
                    }
                });
            }
            return new Response('Image not found', { status: 404 });
        }

        // Handle placeholder request
        if (variant === 'placeholder') {
            const placeholder = ImageProcessor.generateBlurPlaceholder(base64Data);
            
            // Cache placeholder for 1 week
            const cacheTTL = ImageProcessor.getCacheTTL('placeholder');
            ctx.waitUntil(env.FEATURED_PROPERTIES.put(cacheKey, placeholder, { 
                expirationTtl: cacheTTL 
            }));
            
            return new Response(placeholder, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Cache-Control': 'public, max-age=86400',
                    'X-Cache-Status': 'MISS'
                }
            });
        }

        // Process image variant
        const processedImage = await ImageProcessor.processImageVariant(
            base64Data, 
            variant, 
            format, 
            `photo${photoIndex}.jpg`
        );

        // Cache the processed image
        const cacheTTL = ImageProcessor.getCacheTTL(variant);
        ctx.waitUntil(env.FEATURED_PROPERTIES.put(cacheKey, processedImage.binary, { 
            expirationTtl: cacheTTL 
        }));

        // Return the image
        return new Response(processedImage.binary, {
            headers: {
                'Content-Type': processedImage.contentType,
                'Cache-Control': `public, max-age=${cacheTTL}`,
                'ETag': `\"${cacheKey}\"`,
                'X-Cache-Status': 'MISS',
                'X-Original-Size': processedImage.originalSize.toString(),
                'X-Compressed-Size': processedImage.compressedSize.toString(),
                'X-Variant': variant,
                'X-Format': processedImage.format, // Use actual format delivered
                'X-Requested-Format': processedImage.requestedFormat || format, // Show what was requested
                'X-Fallback': processedImage.fallback ? 'true' : 'false'
            }
        });

    } catch (error) {
        console.error('Image handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// Batch image info endpoint - returns metadata about all images for a property
async function handleImageInfo(request, env) {
    try {
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        
        const propref = pathSegments[3]; // /api/images/info/{propref}
        if (!propref) {
            return new Response('Property reference required', { status: 400 });
        }

        // Get property data from main properties list
        const rentmanAPI = new RentmanAPI(env);
        const allProperties = await rentmanAPI.fetchProperties();
        const propertyData = allProperties.find(p => p.propref == propref);
        
        if (!propertyData) {
            return new Response('Property not found', { status: 404 });
        }

        // Build image metadata
        const images = {};
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // Check each photo slot (1-9)
        for (let i = 1; i <= 9; i++) {
            const photoField = `photo${i}binary`;
            if (propertyData[photoField]) {
                images[`photo${i}`] = {
                    thumbnail: `${baseUrl}/api/images/${propref}/thumbnail?photo=${i}`,
                    medium: `${baseUrl}/api/images/${propref}/medium?photo=${i}`,
                    full: `${baseUrl}/api/images/${propref}/full?photo=${i}`,
                    placeholder: `${baseUrl}/api/images/${propref}/placeholder?photo=${i}`,
                    // Auto-format URLs that negotiate best format
                    auto: {
                        thumbnail: `${baseUrl}/api/images/${propref}/thumbnail/auto?photo=${i}`,
                        medium: `${baseUrl}/api/images/${propref}/medium/auto?photo=${i}`,
                        full: `${baseUrl}/api/images/${propref}/full/auto?photo=${i}`
                    }
                };
            }
        }

        return new Response(JSON.stringify({
            success: true,
            propref: propref,
            images: images,
            count: Object.keys(images).length
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // 5 minutes
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Image info handler error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export { handleImageRequest, handleImageInfo };