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
            
            // ✅ REPLACE: Selective cache update instead of deletion
            const success = await this.updatePropertiesCache(propertyIds);
            if (!success) {
                // ✅ FALLBACK: Use existing behavior if selective update fails
                console.warn('Selective cache update failed, falling back to cache invalidation');
                await this.kv.delete('properties_cache');
            }
            
            return true;
        } catch (error) {
            console.error('Error setting featured properties:', error);
            // ✅ FALLBACK: Ensure cache is cleared on error
            try {
                await this.kv.delete('properties_cache');
            } catch (cacheError) {
                console.error('Error clearing cache after failure:', cacheError);
            }
            return false;
        }
    }

    // ✅ NEW: Selective cache update method
    async updatePropertiesCache(featuredIds) {
        try {
            const cacheKey = 'properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            
            if (!cached || !Array.isArray(cached)) {
                console.log('No valid cache found to update');
                return false;
            }

            // Convert to Set for O(1) lookup performance
            const featuredSet = new Set(featuredIds.map(id => String(id)));
            
            // Update featured status in cached properties
            let updatedCount = 0;
            cached.forEach(property => {
                const wasFeatured = property.featured || false;
                const isFeatured = featuredSet.has(String(property.propref));
                
                if (wasFeatured !== isFeatured) {
                    property.featured = isFeatured;
                    updatedCount++;
                }
            });

            // Re-cache the updated data
            await this.kv.put(cacheKey, JSON.stringify(cached), { 
                expirationTtl: CACHE_TTL // 5 minutes (same as CACHE_TTL)
            });

            console.log(`Selectively updated ${updatedCount} properties in cache`);
            return true;

        } catch (error) {
            console.error('Error in selective cache update:', error);
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