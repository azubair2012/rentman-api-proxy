import { RentmanAPI } from '../classes/RentmanAPI';
import { FeaturedPropertiesManager } from '../classes/FeaturedPropertiesManager';
import { ImageProcessor } from '../classes/ImageProcessor';

// Helper function to create JSON responses
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

// Helper function to create error responses
function errorResponse(message, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

// Get all properties
async function getProperties(request, env, corsHeaders) {
    try {
        const rentman = new RentmanAPI(env);
        const properties = await rentman.fetchProperties();

        return new Response(JSON.stringify({
            success: true,
            data: properties,
            count: properties.length,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error fetching properties:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch properties' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Get featured properties
async function getFeaturedProperties(request, env, corsHeaders) {
    try {
        const rentman = new RentmanAPI(env);
        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);

        const [allProperties, featuredIds] = await Promise.all([
            rentman.fetchProperties(),
            featuredManager.getFeaturedPropertyIds(),
        ]);

        console.log(`Filtering ${featuredIds.length} featured properties from ${allProperties.length} total properties`);

        // ✅ NEW: Optimized filtering with Set lookup and early termination
        const featuredIdsSet = new Set(featuredIds.map(id => String(id)));
        const featuredProperties = [];
        
        // Early termination optimization
        for (const property of allProperties) {
            if (featuredIdsSet.has(String(property.propref))) {
                featuredProperties.push(property);
                
                // ✅ OPTIMIZATION: Stop when we've found all featured properties
                if (featuredProperties.length === featuredIds.length) {
                    console.log(`Found all ${featuredIds.length} featured properties, stopping search early`);
                    break;
                }
            }
        }

        console.log(`Returning ${featuredProperties.length} featured properties`);

        return new Response(JSON.stringify({
            success: true,
            data: featuredProperties,
            count: featuredProperties.length,
            // ✅ NEW: Add performance metadata
            performance: {
                totalProperties: allProperties.length,
                featuredFound: featuredProperties.length,
                earlyTermination: featuredProperties.length === featuredIds.length
            }
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error fetching featured properties:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch featured properties' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Get individual property details with media
async function getPropertyDetails(request, env, corsHeaders, propertyId) {
    try {
        if (!propertyId) {
            return new Response(JSON.stringify({ error: 'Property ID is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }

        const rentman = new RentmanAPI(env);
        
        try {
            // ✅ OPTIMIZED: Use direct property details method (includes cache fallback)
            const propertyWithMedia = await rentman.getPropertyDetails(propertyId);
            
            if (!propertyWithMedia) {
                return new Response(JSON.stringify({ error: 'Property not found' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: propertyWithMedia,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        } catch (propertyError) {
            // Handle specific property not found errors
            if (propertyError.message.includes('not found in cache')) {
                return new Response(JSON.stringify({ error: 'Property not found' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }
            throw propertyError; // Re-throw other errors to be caught by outer catch
        }
    } catch (error) {
        console.error('Error fetching property details:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch property details' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Add a new property (without auth)
async function addProperty(request, env, corsHeaders) {
    try {
        const data = await request.json();

        // For now, just return success since we don't have actual property creation
        return new Response(JSON.stringify({
            success: true,
            message: 'Property addition feature not implemented yet',
            data: data,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error adding property:', error);
        return new Response(JSON.stringify({ error: 'Failed to add property' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Update a property (without auth)
async function updateProperty(request, env, corsHeaders, propertyId) {
    try {
        const data = await request.json();

        // For now, just return success since we don't have actual property update
        return new Response(JSON.stringify({
            success: true,
            message: 'Property update feature not implemented yet',
            propertyId: propertyId,
            data: data,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error updating property:', error);
        return new Response(JSON.stringify({ error: 'Failed to update property' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Delete a property (without auth)
async function deleteProperty(request, env, corsHeaders, propertyId) {
    try {
        // For now, just return success since we don't have actual property deletion
        return new Response(JSON.stringify({
            success: true,
            message: 'Property deletion feature not implemented yet',
            propertyId: propertyId,
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Error deleting property:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete property' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Get property media (photos, floor plans, EPC certificates)
async function getPropertyMedia(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const propref = url.searchParams.get('propref');
        const filename = url.searchParams.get('filename');

        if (!propref && !filename) {
            return new Response(JSON.stringify({ error: 'Either propref or filename parameter is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }

        const rentman = new RentmanAPI(env);
        
        if (filename) {
            // Single file request - not commonly used, but supported by API
            const mediaList = await rentman.fetchPropertyMedia(propref || 'unknown');
            const mediaItem = mediaList.find(item => item.filename === filename);
            
            if (!mediaItem) {
                return new Response(JSON.stringify({ error: 'Media file not found' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                });
            }

            // Check if request wants base64 only
            const acceptHeader = request.headers.get('accept');
            if (acceptHeader === 'application/base64') {
                return new Response(mediaItem.base64data, {
                    headers: {
                        'Content-Type': 'text/plain',
                        ...corsHeaders,
                    },
                });
            }

            return new Response(JSON.stringify(mediaItem), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        } else {
            // All media for a property
            const mediaList = await rentman.fetchPropertyMedia(propref);
            
            return new Response(JSON.stringify({
                success: true,
                data: mediaList,
                count: mediaList.length,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }
    } catch (error) {
        console.error('Error fetching property media:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch property media' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

// Toggle featured property (without auth)
async function toggleFeaturedProperty(request, env, corsHeaders) {
    try {
        const { propertyId } = await request.json();

        if (!propertyId) {
            return new Response(JSON.stringify({ error: 'Property ID is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }

        const featuredManager = new FeaturedPropertiesManager(env.FEATURED_PROPERTIES, env);
        try {
            const updatedFeatured = await featuredManager.toggleFeaturedProperty(propertyId);
            return new Response(JSON.stringify({
                success: true,
                data: { featuredPropertyIds: updatedFeatured },
                message: "Featured status updated successfully",
                limits: {
                    min: featuredManager.minFeatured,
                    max: featuredManager.maxFeatured,
                    current: updatedFeatured.length
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        } catch (limitError) {
            return new Response(JSON.stringify({ error: limitError.message }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            });
        }
    } catch (error) {
        console.error('Error toggling featured property:', error);
        return new Response(JSON.stringify({ error: 'Failed to toggle featured property' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    }
}

export {
    getProperties,
    getPropertyDetails,
    getPropertyMedia,
    getFeaturedProperties,
    addProperty,
    updateProperty,
    deleteProperty,
    toggleFeaturedProperty
};