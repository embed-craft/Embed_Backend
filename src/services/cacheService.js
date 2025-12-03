const Redis = require('ioredis');

class CacheService {
    constructor() {
        // Connect to local Redis by default
        // Connect to local Redis by default
        // this.redis = new Redis({
        //     host: process.env.REDIS_HOST || '127.0.0.1',
        //     port: process.env.REDIS_PORT || 6379,
        //     retryStrategy: (times) => Math.min(times * 50, 2000),
        //     maxRetriesPerRequest: 1
        // });

        // MOCK REDIS for now to prevent crash if Redis is missing
        this.redis = {
            on: () => { },
            get: async () => null,
            set: async () => { },
            del: async () => { }
        };

        // this.redis.on('error', (err) => {
        //     console.warn('Redis Error (Silent Fail):', err.message);
        // });
    }

    /**
     * Get active nudges for a screen from cache
     * @param {string} screenName 
     * @returns {Promise<Array|null>}
     */
    async getNudges(screenName) {
        try {
            const key = `nudge:screen:${screenName}:active`;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Cache Read Failed:', error.message);
            return null; // Silent fail
        }
    }

    /**
     * Set active nudges for a screen in cache
     * @param {string} screenName 
     * @param {Array} nudges 
     * @param {number} ttlSeconds 
     */
    async setNudges(screenName, nudges, ttlSeconds = 600) {
        try {
            const key = `nudge:screen:${screenName}:active`;
            await this.redis.set(key, JSON.stringify(nudges), 'EX', ttlSeconds);
        } catch (error) {
            console.warn('Cache Write Failed:', error.message);
            // Silent fail
        }
    }

    /**
     * Invalidate cache for a screen (e.g. after update)
     * @param {string} screenName 
     */
    async invalidateCache(screenName) {
        try {
            const key = `nudge:screen:${screenName}:active`;
            await this.redis.del(key);
        } catch (error) {
            console.warn('Cache Invalidate Failed:', error.message);
        }
    }
}

module.exports = new CacheService();
