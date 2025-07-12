/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Optimized Rentman API Proxy with Featured Properties Management
 * 
 * Optimizations made:
 * - Implemented proper caching with TTL
 * - Removed duplicate function definitions
 * - Optimized image processing
 * - Added request timeouts
 * - Implemented streaming for large responses
 * - Added memory-efficient data processing
 */

import {
    addProperty,
    deleteProperty,
    getProperties,
    updateProperty,
    getFeaturedProperties,
    toggleFeaturedProperty
} from './handlers/propertyHandlers';
import { getAdminHTML } from './views/adminView';

// Main request handler
export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // CORS headers
            const corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            };

            // Handle preflight CORS requests
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 200,
                    headers: corsHeaders,
                });
            }

            // Route directly to admin view for root path
            if (path === '/' || path === '/admin') {
                const adminHTML = getAdminHTML(env);
                return new Response(adminHTML, {
                    headers: {
                        'Content-Type': 'text/html',
                        ...corsHeaders
                    },
                });
            }

            // API routes for properties (no auth required)
            if (path === '/api/properties') {
                switch (request.method) {
                    case 'GET':
                        return await getProperties(request, env, corsHeaders);
                    case 'POST':
                        return await addProperty(request, env, corsHeaders);
                    default:
                        return new Response('Method not allowed', {
                            status: 405,
                            headers: corsHeaders
                        });
                }
            }

            if (path.startsWith('/api/properties/')) {
                const propertyId = path.split('/')[3];

                switch (request.method) {
                    case 'PUT':
                        return await updateProperty(request, env, corsHeaders, propertyId);
                    case 'DELETE':
                        return await deleteProperty(request, env, corsHeaders, propertyId);
                    default:
                        return new Response('Method not allowed', {
                            status: 405,
                            headers: corsHeaders
                        });
                }
            }

            // Featured properties endpoint
            if (path === '/api/featured') {
                if (request.method === 'GET') {
                    return await getFeaturedProperties(request, env, corsHeaders);
                }
                return new Response('Method not allowed', {
                    status: 405,
                    headers: corsHeaders
                });
            }

            // Toggle featured property endpoint
            if (path === '/api/featured/toggle') {
                if (request.method === 'POST') {
                    return await toggleFeaturedProperty(request, env, corsHeaders);
                }
                return new Response('Method not allowed', {
                    status: 405,
                    headers: corsHeaders
                });
            }

            // Default 404 for unknown routes
            return new Response('Not Found', {
                status: 404,
                headers: corsHeaders
            });

        } catch (error) {
            console.error('Error in fetch handler:', error);
            return new Response('Internal Server Error', {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'text/plain',
                },
            });
        }
    }
};