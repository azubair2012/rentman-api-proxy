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

import { handleCORS, errorResponse } from './utils/helpers';
import { handleLogin, handleLogout, requireAuth } from './handlers/authHandlers';
import { handleGetProperties, handleGetFeaturedProperties, handleToggleFeaturedProperty, handleAdminProperties, handlePropertyMedia } from './handlers/propertyHandlers';
import { getLoginHTML } from './views/loginView';
import { getAdminHTML } from './views/adminView';
import { AuthManager } from './classes/AuthManager';
import { RentmanAPI } from './classes/RentmanAPI';
import { FeaturedPropertiesManager } from './classes/FeaturedPropertiesManager';
import { ImageProcessor } from './classes/ImageProcessor';

// Main request handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight requests
        const corsResponse = handleCORS(request);
        if (corsResponse) return corsResponse;

        try {
            switch (path) {
                case '/api/properties':
                    return await handleGetProperties(request, env);

                case '/api/properties/featured':
                    return await handleGetFeaturedProperties(request, env);

                case '/api/properties/featured/toggle':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleToggleFeaturedProperty(request, env);

                case '/api/admin/properties':
                    return await handleAdminProperties(request, env);

                case '/api/auth/login':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleLogin(request, env);

                case '/api/auth/logout':
                    if (request.method !== 'POST') {
                        return errorResponse('Method not allowed', 405);
                    }
                    return await handleLogout(request, env);

                case '/login':
                    return new Response(getLoginHTML(), {
                        headers: { 'Content-Type': 'text/html' },
                    });

                case '/admin':
                    return new Response(getAdminHTML(), {
                        headers: { 'Content-Type': 'text/html' },
                    });

                case '/':
                    return new Response(JSON.stringify({
                        message: 'Rentman API Proxy',
                        endpoints: {
                            properties: '/api/properties',
                            featured: '/api/properties/featured',
                            admin: '/admin',
                            login: '/login',
                        },
                    }), {
                        headers: { 'Content-Type': 'application/json' },
                    });

                case '/api/propertymedia':
                    return await handlePropertyMedia(request, env);

                default:
                    return errorResponse('Not Found', 404);
            }
        } catch (error) {
            console.error('Request error:', error);
            return errorResponse('Internal Server Error', 500);
        }
    },
};

// Export classes for testing
export { RentmanAPI, FeaturedPropertiesManager, AuthManager, ImageProcessor };