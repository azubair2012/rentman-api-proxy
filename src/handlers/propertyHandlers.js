import { RentmanAPI } from '../classes/RentmanAPI';
import { FeaturedPropertiesManager } from '../classes/FeaturedPropertiesManager';
import { ImageProcessor } from '../classes/ImageProcessor';
import { errorResponse, jsonResponse, corsHeaders, IMAGE_CACHE_TTL } from '../utils/helpers';
import { AuthManager } from '../classes/AuthManager';
import { requireAuth } from './authHandlers';

// Optimized property handlers
async function handleGetProperties(request, env) {
    try {
        const rentman = new RentmanAPI(env);
        const properties = await rentman.fetchProperties();

        return jsonResponse({
            success: true,
            data: properties,
            count: properties.length,
        });
    } catch (error) {
        return errorResponse('Failed to fetch properties', 500);
    }
}

async function handleGetFeaturedProperties(request, env) {
    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        const featuredProperties = allProperties.filter(property =>
            featuredIds.includes(String(property.propref))
        );

        return jsonResponse({
            success: true,
            data: featuredProperties,
            count: featuredProperties.length,
        });
    } catch (error) {
        return errorResponse('Failed to fetch featured properties', 500);
    }
}

async function handleToggleFeaturedProperty(request, env) {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    try {
        const { propertyId } = await request.json();

        if (!propertyId) {
            return errorResponse('Property ID is required');
        }

        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);
        try {
            const updatedFeatured = await featuredManager.toggleFeaturedProperty(propertyId);
            return jsonResponse({
                success: true,
                data: { featuredPropertyIds: updatedFeatured },
                message: "Featured status updated successfully",
                limits: { min: featuredManager.minFeatured, max: featuredManager.maxFeatured, current: updatedFeatured.length }
            });
        } catch (limitError) {
            return errorResponse(limitError.message, 400);
        }
    } catch (error) {
        return errorResponse('Failed to toggle featured property', 500);
    }
}

async function handleAdminProperties(request, env) {
    const authError = requireAuth(request, env);
    if (authError) return authError;

    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        // Process properties in chunks to avoid memory issues
        const chunkSize = 50;
        const propertiesWithFeaturedStatus = [];

        for (let i = 0; i < allProperties.length; i += chunkSize) {
            const chunk = allProperties.slice(i, i + chunkSize);
            const processedChunk = chunk.map(property => ({
                ...property,
                isFeatured: featuredIds.includes(String(property.propref)),
            }));
            propertiesWithFeaturedStatus.push(...processedChunk);
        }

        return jsonResponse({
            success: true,
            data: propertiesWithFeaturedStatus,
            count: propertiesWithFeaturedStatus.length,
            featuredCount: featuredIds.length,
        });
    } catch (error) {
        console.error('Admin properties error:', error);
        return errorResponse('Failed to fetch admin properties: ' + error.message, 500);
    }
}

async function handlePropertyMedia(request, env) {
    try {
        const url = new URL(request.url);
        const propref = url.searchParams.get('propref');
        const filename = url.searchParams.get('filename');
        const token = env.RENTMAN_API_TOKEN;

        if (!token) {
            return errorResponse('Missing Rentman API token', 500);
        }

        if (propref) {
            // Fetch media list for the property
            const rentman = new RentmanAPI(env);
            const mediaList = await rentman.fetchPropertyMedia(propref);

            return jsonResponse(mediaList);
        } else if (filename) {
            // Fetch the image itself with caching
            const cacheKey = `image_${filename}`;
            const cachedImage = await env.FEATURED_PROPERTIES.get(cacheKey, 'arrayBuffer');

            if (cachedImage) {
                let contentType = 'image/jpeg';
                if (filename.match(/\.png$/i)) contentType = 'image/png';
                else if (filename.match(/\.gif$/i)) contentType = 'image/gif';
                else if (filename.match(/\.webp$/i)) contentType = 'image/webp';

                return new Response(cachedImage, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=86400',
                        ...corsHeaders
                    }
                });
            }

            // Fetch new image with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const rentmanUrl = `${env.RENTMAN_API_BASE_URL || 'https://www.rentman.online'}/propertymedia.php?filename=${encodeURIComponent(filename)}`;
            const rentmanResponse = await fetch(rentmanUrl, {
                headers: {
                    'token': token,
                    'ACCEPT': 'application/base64'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!rentmanResponse.ok) {
                throw new Error(`Failed to fetch image: ${rentmanResponse.status}`);
            }

            const base64 = await rentmanResponse.text();
            const { binary, contentType } = await ImageProcessor.processBase64Image(base64, filename);

            // Cache the processed image
            await env.FEATURED_PROPERTIES.put(cacheKey, binary, { expirationTtl: IMAGE_CACHE_TTL });

            return new Response(binary, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                    ...corsHeaders
                }
            });
        } else {
            return errorResponse('Missing propref or filename query parameter', 400);
        }
    } catch (error) {
        return errorResponse('Internal error in property media handler: ' + error.message, 500);
    }
}

export { handleGetProperties, handleGetFeaturedProperties, handleToggleFeaturedProperty, handleAdminProperties, handlePropertyMedia };