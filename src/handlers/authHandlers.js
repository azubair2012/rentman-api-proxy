import { AuthManager } from '../classes/AuthManager';
import { errorResponse, jsonResponse, corsHeaders } from '../utils/helpers';

// Authentication Handlers
async function handleLogin(request, env) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return errorResponse('Username and password are required');
        }

        const authManager = new AuthManager(env);

        if (authManager.authenticate(username, password)) {
            const sessionToken = authManager.generateSessionToken();

            return new Response(JSON.stringify({
                success: true,
                message: 'Login successful',
                sessionToken: sessionToken
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
                }
            });
        } else {
            return errorResponse('Invalid credentials', 401);
        }
    } catch (error) {
        return errorResponse('Login failed: ' + error.message, 500);
    }
}

async function handleLogout(request, env) {
    return jsonResponse({
        success: true,
        message: 'Logout successful'
    });
}

function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const authManager = new AuthManager(env);

    if (!authManager.verifySessionToken(token)) {
        return errorResponse('Invalid or expired session', 401);
    }

    return null; // No error
}

export { handleLogin, handleLogout, requireAuth };