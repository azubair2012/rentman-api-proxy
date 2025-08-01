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

        const featuredProperties = allProperties.filter(property =>
            featuredIds.includes(String(property.propref))
        );

        return new Response(JSON.stringify({
            success: true,
            data: featuredProperties,
            count: featuredProperties.length,
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
    getFeaturedProperties,
    addProperty,
    updateProperty,
    deleteProperty,
    toggleFeaturedProperty
};