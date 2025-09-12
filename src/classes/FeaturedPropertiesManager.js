// Featured Properties Manager
import { CACHE_TTL, FEATURED_PROPERTIES_TTL } from '../utils/helpers';

class FeaturedPropertiesManager {
    constructor(kv, env) {
        this.kv = kv;
        this.env = env;
        this.maxFeatured = parseInt(env.MAX_FEATURED_PROPERTIES) || 10;
        this.minFeatured = parseInt(env.MIN_FEATURED_PROPERTIES) || 7;
    }

    async getFeaturedPropertyIds() {
        try {
            // ✅ PHASE 2: Add caching with smart TTL for featured property IDs
            const cacheKey = 'featured_properties_cache';
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log('Using cached featured property IDs');
                return cached;
            }

            // Get from main storage
            const featured = await this.kv.get('featured_properties', 'json');
            const featuredIds = featured || [];

            // Cache with longer TTL since featured properties change less frequently
            if (featuredIds.length > 0) {
                await this.kv.put(cacheKey, JSON.stringify(featuredIds), {
                    expirationTtl: FEATURED_PROPERTIES_TTL
                });
                console.log(`Cached ${featuredIds.length} featured property IDs for 24 hours`);
            }

            return featuredIds;
        } catch (error) {
            console.error('Error getting featured properties:', error);
            return [];
        }
    }

    async setFeaturedPropertyIds(propertyIds) {
        try {
            await this.kv.put('featured_properties', JSON.stringify(propertyIds));
            
            // ✅ PHASE 2: Clear featured properties cache when IDs change
            await this.kv.delete('featured_properties_cache');
            
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

    // ✅ NEW: Auto-backfill scheduling system
    async scheduleAutoBackfill(currentCount, targetCount = null) {
        targetCount = targetCount || this.minFeatured;
        const shortfall = targetCount - currentCount;
        if (shortfall <= 0) return null;
        
        const executeAt = Date.now() + (5 * 60 * 1000); // 5 minutes
        const backfillJob = {
            scheduledAt: Date.now(),
            executeAt: executeAt,
            shortfall: shortfall,
            targetCount: targetCount,
            currentCount: currentCount,
            status: 'pending'
        };
        
        await this.kv.put('backfill_job', JSON.stringify(backfillJob), {
            expirationTtl: 600 // 10 minutes (buffer)
        });
        
        console.log(`Scheduled auto-backfill: ${shortfall} properties in 5 minutes`);
        return backfillJob;
    }

    // ✅ NEW: Get available properties for random selection
    async getAvailableProperties() {
        try {
            const { RentmanAPI } = await import('./RentmanAPI.js');
            const rentman = new RentmanAPI(this.env);
            
            // Get all properties
            const allProperties = await rentman.getAllProperties();
            if (!Array.isArray(allProperties)) return [];
            
            // Get currently featured property IDs
            const featuredIds = await this.getFeaturedPropertyIds();
            const featuredSet = new Set(featuredIds.map(id => String(id)));
            
            // Filter out already featured properties
            return allProperties.filter(property => 
                !featuredSet.has(String(property.propref))
            );
        } catch (error) {
            console.error('Error getting available properties:', error);
            return [];
        }
    }

    // ✅ NEW: Select random properties for backfill
    selectRandomProperties(availableProperties, count) {
        if (!Array.isArray(availableProperties) || availableProperties.length === 0) {
            return [];
        }
        
        // Shuffle array using Fisher-Yates algorithm
        const shuffled = [...availableProperties];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Return requested number of properties
        return shuffled.slice(0, Math.min(count, shuffled.length))
                      .map(property => property.propref);
    }

    // ✅ NEW: Process scheduled backfill
    async processBackfill() {
        try {
            const job = await this.kv.get('backfill_job', 'json');
            if (!job || job.status !== 'pending') {
                return { processed: false, reason: 'No pending job' };
            }
            
            if (Date.now() < job.executeAt) {
                return { processed: false, reason: 'Not yet time to execute' };
            }
            
            // Get current featured properties
            const currentFeatured = await this.getFeaturedPropertyIds();
            
            // Check if we still need backfill
            if (currentFeatured.length >= job.targetCount) {
                await this.kv.delete('backfill_job');
                return { 
                    processed: true, 
                    reason: 'Target already reached',
                    current: currentFeatured.length,
                    target: job.targetCount
                };
            }
            
            // Get available properties
            const availableProperties = await this.getAvailableProperties();
            const needed = job.targetCount - currentFeatured.length;
            const selected = this.selectRandomProperties(availableProperties, needed);
            
            if (selected.length === 0) {
                await this.kv.delete('backfill_job');
                return { 
                    processed: true, 
                    reason: 'No available properties to select',
                    current: currentFeatured.length
                };
            }
            
            // Add selected properties to featured list
            const newFeatured = [...currentFeatured, ...selected];
            await this.setFeaturedPropertyIds(newFeatured);
            
            // Clean up job
            await this.kv.delete('backfill_job');
            
            console.log(`Auto-backfill completed: Added ${selected.length} properties`);
            return {
                processed: true,
                reason: 'Backfill completed successfully',
                added: selected,
                current: newFeatured.length,
                target: job.targetCount
            };
            
        } catch (error) {
            console.error('Error processing backfill:', error);
            // Don't delete job on error, let it retry
            return { processed: false, reason: 'Error occurred', error: error.message };
        }
    }

    // ✅ NEW: Get backfill status
    async getBackfillStatus() {
        try {
            const job = await this.kv.get('backfill_job', 'json');
            if (!job) return null;
            
            return {
                ...job,
                timeRemaining: Math.max(0, job.executeAt - Date.now()),
                isReady: Date.now() >= job.executeAt
            };
        } catch (error) {
            console.error('Error getting backfill status:', error);
            return null;
        }
    }

    async toggleFeaturedProperty(propertyId) {
        try {
            const featured = await this.getFeaturedPropertyIds();
            const index = featured.indexOf(propertyId);

            if (index > -1) {
                // Removing a property
                featured.splice(index, 1);
                
                // Check if we need to schedule auto-backfill
                if (featured.length < this.minFeatured) {
                    const backfillJob = await this.scheduleAutoBackfill(featured.length);
                    await this.setFeaturedPropertyIds(featured);
                    
                    return {
                        featured,
                        autoBackfillScheduled: true,
                        backfillAt: backfillJob.executeAt,
                        message: `Property removed. ${backfillJob.shortfall} properties will be automatically added in 5 minutes.`,
                        shortfall: backfillJob.shortfall
                    };
                }
            } else {
                // Adding a property
                if (featured.length >= this.maxFeatured) {
                    throw new Error(`Cannot add property. Maximum of ${this.maxFeatured} featured properties allowed.`);
                }
                featured.push(propertyId);
            }

            await this.setFeaturedPropertyIds(featured);
            return { featured };
        } catch (error) {
            console.error('Error toggling featured property:', error);
            throw error;
        }
    }
}

export { FeaturedPropertiesManager };