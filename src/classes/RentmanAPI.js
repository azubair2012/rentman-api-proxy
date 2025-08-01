// Optimized Rentman API client with caching
import { CACHE_TTL } from '../utils/helpers';

class RentmanAPI {
    constructor(env) {
        this.baseUrl = env.RENTMAN_API_BASE_URL || 'https://www.rentman.online';
        this.token = env.RENTMAN_API_TOKEN ? decodeURIComponent(env.RENTMAN_API_TOKEN) : null;
        this.kv = env.FEATURED_PROPERTIES;
    }

    async fetchProperties() {
        try {
            // Check cache first
            const cacheKey = 'properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                return cached;
            }

            // Fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const url = `${this.baseUrl}/propertyadvertising.php?token=${this.token}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Rentman API error: ${response.status}`);
            }

            const data = await response.json();
            const properties = data || [];

            // Cache the response
            await this.kv.put(cacheKey, JSON.stringify(properties), { expirationTtl: CACHE_TTL });

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

            const url = `${this.baseUrl}/propertymedia.php?propref=${encodeURIComponent(propref)}`;
            const response = await fetch(url, {
                headers: { 'token': this.token }
            });

            if (!response.ok) {
                throw new Error(`Media API error: ${response.status}`);
            }

            const mediaList = await response.json();

            // Cache the media list
            await this.kv.put(cacheKey, JSON.stringify(mediaList), { expirationTtl: CACHE_TTL });

            return mediaList;
        } catch (error) {
            console.error('Error fetching property media:', error);
            throw error;
        }
    }
}

export { RentmanAPI };