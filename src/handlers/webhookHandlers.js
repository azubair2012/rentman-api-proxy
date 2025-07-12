import { errorResponse, jsonResponse } from '../utils/helpers';

/**
 * Verify Clerk webhook signature
 * This ensures the webhook is actually from Clerk
 */
function verifyWebhookSignature(payload, signature, secret) {
    // Clerk uses HMAC-SHA256 for webhook signatures
    // For Cloudflare Workers, we'll implement a basic verification
    // In production, you should implement proper HMAC verification

    // For now, just check if signature exists
    // TODO: Implement proper HMAC-SHA256 verification
    return signature && secret;
}

/**
 * Handle Clerk webhook events
 */
async function handleClerkWebhook(request, env) {
    try {
        // Get webhook signature from headers
        const signature = request.headers.get('svix-signature') ||
            request.headers.get('clerk-signature');

        if (!signature) {
            return errorResponse('Missing webhook signature', 401);
        }

        // Get the payload
        const payload = await request.text();

        // Verify the webhook signature
        const webhookSecret = env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.warn('CLERK_WEBHOOK_SECRET not configured - webhook verification skipped');
        } else {
            const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                return errorResponse('Invalid webhook signature', 401);
            }
        }

        // Parse the event
        let event;
        try {
            event = JSON.parse(payload);
        } catch (error) {
            return errorResponse('Invalid JSON payload', 400);
        }

        console.log('Received Clerk webhook event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'user.created':
                await handleUserCreated(event.data);
                break;

            case 'user.updated':
                await handleUserUpdated(event.data);
                break;

            case 'user.deleted':
                await handleUserDeleted(event.data);
                break;

            case 'session.created':
                await handleSessionCreated(event.data);
                break;

            case 'session.ended':
                await handleSessionEnded(event.data);
                break;

            default:
                console.log('Unhandled webhook event type:', event.type);
        }

        return jsonResponse({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return errorResponse('Webhook processing failed', 500);
    }
}

/**
 * Handle user created event
 */
async function handleUserCreated(userData) {
    console.log('New user created:', {
        id: userData.id,
        email: userData.email_addresses && userData.email_addresses[0] && userData.email_addresses[0].email_address,
        firstName: userData.first_name,
        lastName: userData.last_name
    });

    // Add your custom logic here:
    // - Send welcome email
    // - Create user profile in database
    // - Set default permissions
    // - Add to analytics
}

/**
 * Handle user updated event
 */
async function handleUserUpdated(userData) {
    console.log('User updated:', {
        id: userData.id,
        email: userData.email_addresses && userData.email_addresses[0] && userData.email_addresses[0].email_address
    });

    // Add your custom logic here:
    // - Update user profile in database
    // - Sync with external services
    // - Update analytics
}

/**
 * Handle user deleted event
 */
async function handleUserDeleted(userData) {
    console.log('User deleted:', {
        id: userData.id
    });

    // Add your custom logic here:
    // - Clean up user data
    // - Revoke permissions
    // - Update analytics
    // - GDPR compliance cleanup
}

/**
 * Handle session created event
 */
async function handleSessionCreated(sessionData) {
    console.log('Session created:', {
        id: sessionData.id,
        userId: sessionData.user_id
    });

    // Add your custom logic here:
    // - Log login analytics
    // - Check for security anomalies
    // - Update last login time
}

/**
 * Handle session ended event
 */
async function handleSessionEnded(sessionData) {
    console.log('Session ended:', {
        id: sessionData.id,
        userId: sessionData.user_id
    });

    // Add your custom logic here:
    // - Log logout analytics
    // - Clean up temporary data
    // - Update session duration metrics
}

export { handleClerkWebhook };