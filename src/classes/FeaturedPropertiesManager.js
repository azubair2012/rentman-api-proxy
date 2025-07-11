// Featured Properties Manager
import { CACHE_TTL } from '../utils/helpers';

class FeaturedPropertiesManager {
    constructor(kv, env) {
        this.kv = kv;
        this.maxFeatured = 10;
        this.minFeatured = 7;
    }

    async getFeaturedPropertyIds() {
        try {
            const featured = await this.kv.get('featured_properties', 'json');
            return featured || [];
        } catch (error) {
            console.error('Error getting featured properties:', error);
            return [];
        }
    }

    async setFeaturedPropertyIds(propertyIds) {
        try {
            await this.kv.put('featured_properties', JSON.stringify(propertyIds));
            // Invalidate cache when featured properties change
            await this.kv.delete('properties_cache');
            return true;
        } catch (error) {
            console.error('Error setting featured properties:', error);
            return false;
        }
    }

    async toggleFeaturedProperty(propertyId) {
        try {
            const featured = await this.getFeaturedPropertyIds();
            const index = featured.indexOf(propertyId);

            if (index > -1) {
                // Removing a property
                featured.splice(index, 1);
            } else {
                // Adding a property
                if (featured.length >= this.maxFeatured) {
                    throw new Error(`Cannot add property. Maximum of ${this.maxFeatured} featured properties allowed.`);
                }
                featured.push(propertyId);
            }

            await this.setFeaturedPropertyIds(featured);
            return featured;
        } catch (error) {
            console.error('Error toggling featured property:', error);
            throw error;
        }
    }
}

export { FeaturedPropertiesManager };