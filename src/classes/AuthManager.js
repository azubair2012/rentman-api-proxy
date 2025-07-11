// Authentication Manager
class AuthManager {
    constructor(env) {
        this.adminUsername = env.ADMIN_USERNAME;
        this.adminPassword = env.ADMIN_PASSWORD;
        this.sessionSecret = env.SESSION_SECRET;

        if (!this.adminUsername || !this.adminPassword || !this.sessionSecret) {
            throw new Error('Missing required authentication credentials.');
        }
    }

    generateSessionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${timestamp}:${random}:${this.sessionSecret}`).replace(/[^a-zA-Z0-9]/g, '');
    }

    verifySessionToken(token) {
        try {
            const decoded = atob(token);
            const [timestamp, random, secret] = decoded.split(':');
            const sessionAge = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            return secret === this.sessionSecret && sessionAge < maxAge;
        } catch (error) {
            return false;
        }
    }

    authenticate(username, password) {
        return username === this.adminUsername && password === this.adminPassword;
    }
}

export { AuthManager };