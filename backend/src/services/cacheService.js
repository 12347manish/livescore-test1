const redis = require('../config/redis');
require('dotenv').config();

/**
 * ⚡⚡⚡ CACHE SERVICE - OPTIMIZED FOR ZERO LATENCY ⚡⚡⚡
 * 
 * KEY CHANGES FROM ORIGINAL:
 * 1. CACHE_LIVE_SCORES_TTL: 120s → 15s (8x FASTER refresh)
 * 2. CACHE_MATCH_DETAILS_TTL: 300s → 45s (6.6x FASTER)
 * 3. NEW: CACHE_MATCH_STATUS_TTL: 10s (CRITICAL for trading)
 * 4. NEW: Latency tracking for monitoring
 * 5. NEW: High-resolution timing (microseconds)
 * 6. NEW: Batch operations for efficiency
 */

// Read from environment with optimized defaults
const CACHE_TTL = {
  LIVE_SCORES: parseInt(process.env.CACHE_LIVE_SCORES_TTL) || 15,      // 15s - CHANGED
  MATCH_DETAILS: parseInt(process.env.CACHE_MATCH_DETAILS_TTL) || 45,   // 45s - CHANGED
  MATCH_EVENTS: parseInt(process.env.CACHE_EVENTS_TTL) || 900,          // 900s - Kept
  MATCH_STATUS: parseInt(process.env.CACHE_MATCH_STATUS_TTL) || 10      // 10s - NEW
};

console.log('📊 CACHE TTL CONFIGURATION:');
console.log(`   Live Scores: ${CACHE_TTL.LIVE_SCORES}s (CHANGED from 120s)`);
console.log(`   Match Details: ${CACHE_TTL.MATCH_DETAILS}s (CHANGED from 300s)`);
console.log(`   Match Status: ${CACHE_TTL.MATCH_STATUS}s (NEW - CRITICAL)`);
console.log(`   Match Events: ${CACHE_TTL.MATCH_EVENTS}s`);

class CacheService {
  
  /**
   * CHANGE 1: Get live scores from cache with latency tracking
   */
  async getLiveScores(sport) {
    try {
      const startTime = process.hrtime.bigint();
      const cacheKey = `live_scores:${sport}`;
      const cachedData = await redis.get(cacheKey);
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        
        // Track latency
        if (process.env.ENABLE_LATENCY_TRACKING === 'true') {
          await redis.lpush('latency:cache_hits', latencyMs.toFixed(2));
          await redis.ltrim('latency:cache_hits', 0, 999);
        }
        
        console.log(`✅ Cache HIT (${latencyMs.toFixed(2)}ms): ${cacheKey} [TTL: ${CACHE_TTL.LIVE_SCORES}s]`);
        return data;
      }

      console.log(`❌ Cache MISS (${latencyMs.toFixed(2)}ms): ${cacheKey}`);
      return null;

    } catch (error) {
      console.error('Error reading from Redis:', error.message);
      return null;
    }
  }

  /**
   * CHANGE 2: Set live scores with OPTIMIZED TTL (15s instead of 120s)
   */
  async setLiveScores(sport, data, ttl = null) {
    try {
      const startTime = process.hrtime.bigint();
      const cacheKey = `live_scores:${sport}`;
      const serialized = JSON.stringify(data);
      
      // Use optimized TTL from environment
      const finalTTL = ttl || CACHE_TTL.LIVE_SCORES; // 15 seconds

      await redis.setex(cacheKey, finalTTL, serialized);

      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1000000;

      console.log(`💾 Cache SET (${latencyMs.toFixed(2)}ms): ${cacheKey} [TTL: ${finalTTL}s, Size: ${(serialized.length / 1024).toFixed(2)}KB]`);
      
      // Track latency
      if (process.env.ENABLE_LATENCY_TRACKING === 'true') {
        await redis.lpush('latency:cache_sets', latencyMs.toFixed(2));
        await redis.ltrim('latency:cache_sets', 0, 999);
      }
      
      return true;

    } catch (error) {
      console.error('Error writing to Redis:', error.message);
      return false;
    }
  }

  /**
   * CHANGE 3: Batch operations for efficiency
   */
  async setMultipleScores(updates) {
    try {
      const pipeline = redis.pipeline();

      for (const [sport, data, ttl] of updates) {
        const cacheKey = `live_scores:${sport}`;
        const finalTTL = ttl || CACHE_TTL.LIVE_SCORES;
        pipeline.setex(cacheKey, finalTTL, JSON.stringify(data));
      }

      await pipeline.exec();
      console.log(`💾 Batch SET: ${updates.length} scores cached`);
      return true;

    } catch (error) {
      console.error('Error in batch set:', error.message);
      return false;
    }
  }

  /**
   * Get match details from cache
   */
  async getMatchDetails(fixtureId, sport) {
    try {
      const cacheKey = `match:details:${sport}:${fixtureId}`;
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return JSON.parse(cachedData);
      }

      return null;

    } catch (error) {
      console.error('Error reading match details:', error.message);
      return null;
    }
  }

  /**
   * CHANGE 4: Set match details with OPTIMIZED TTL (45s instead of 300s)
   */
  async setMatchDetails(fixtureId, sport, data, ttl = null) {
    try {
      const cacheKey = `match:details:${sport}:${fixtureId}`;
      const finalTTL = ttl || CACHE_TTL.MATCH_DETAILS; // 45 seconds
      
      await redis.setex(cacheKey, finalTTL, JSON.stringify(data));
      
      console.log(`💾 Match details cached [TTL: ${finalTTL}s] (CHANGED from 300s)`);
      return true;

    } catch (error) {
      console.error('Error storing match details:', error.message);
      return false;
    }
  }

  /**
   * CHANGE 5: NEW - Set match status with ULTRA SHORT TTL (10s - CRITICAL for trading)
   */
  async setMatchStatus(fixtureId, sport, status) {
    try {
      const cacheKey = `match:status:${sport}:${fixtureId}`;
      const ttl = CACHE_TTL.MATCH_STATUS; // 10 seconds - CRITICAL
      
      await redis.setex(cacheKey, ttl, JSON.stringify({
        status,
        updated_at: Date.now()
      }));
      
      console.log(`🎯 Match status cached [TTL: ${ttl}s - CRITICAL for trading]`);
      return true;

    } catch (error) {
      console.error('Error storing match status:', error.message);
      return false;
    }
  }

  /**
   * Get match status
   */
  async getMatchStatus(fixtureId, sport) {
    try {
      const cacheKey = `match:status:${sport}:${fixtureId}`;
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      return null;

    } catch (error) {
      console.error('Error reading match status:', error.message);
      return null;
    }
  }

  /**
   * Add match event (append-only, long TTL)
   */
  async addMatchEvent(fixtureId, event) {
    try {
      const cacheKey = `match:events:${fixtureId}`;
      
      await redis.lpush(cacheKey, JSON.stringify(event));
      await redis.ltrim(cacheKey, 0, 99);
      await redis.expire(cacheKey, CACHE_TTL.MATCH_EVENTS);

      return true;

    } catch (error) {
      console.error('Error storing match event:', error.message);
      return false;
    }
  }

  /**
   * Get match events
   */
  async getMatchEvents(fixtureId, limit = 50) {
    try {
      const cacheKey = `match:events:${fixtureId}`;
      const events = await redis.lrange(cacheKey, 0, limit - 1);

      return events.map(e => JSON.parse(e)).reverse();

    } catch (error) {
      console.error('Error reading match events:', error.message);
      return [];
    }
  }

  /**
   * Store rate limit info
   */
  async setRateLimit(entity, remaining, resetTime) {
    try {
      const cacheKey = `rate_limit:${entity}`;
      const ttl = Math.ceil((resetTime - Date.now()) / 1000);

      if (ttl > 0) {
        await redis.setex(cacheKey, ttl, JSON.stringify({
          remaining,
          reset_time: resetTime,
          checked_at: Date.now()
        }));
      }

      if (remaining < 100) {
        console.warn(`⚠️ LOW RATE LIMIT: ${entity} has ${remaining} requests left`);
      }

      return true;

    } catch (error) {
      console.error('Error storing rate limit:', error.message);
      return false;
    }
  }

  /**
   * Invalidate cache
   */
  async invalidateLiveScores(sport) {
    try {
      const cacheKey = `live_scores:${sport}`;
      await redis.del(cacheKey);
      console.log(`🗑️ Cache INVALIDATED: ${cacheKey}`);
      return true;

    } catch (error) {
      console.error('Error invalidating cache:', error.message);
      return false;
    }
  }

  /**
   * CHANGE 6: NEW - Get latency statistics for monitoring
   */
  async getLatencyStats() {
    try {
      const hits = await redis.lrange('latency:cache_hits', 0, -1);
      const sets = await redis.lrange('latency:cache_sets', 0, -1);

      const getStats = (arr) => {
        if (arr.length === 0) return null;
        const nums = arr.map(Number);
        return {
          avg: (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2),
          min: Math.min(...nums).toFixed(2),
          max: Math.max(...nums).toFixed(2),
          count: nums.length
        };
      };

      return {
        cache_hits: getStats(hits),        // Should be <5ms
        cache_sets: getStats(sets),        // Should be <10ms
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error getting latency stats:', error.message);
      return null;
    }
  }

  /**
   * Generic get - retrieve any cached value by key
   */
  async get(key) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error(`Error reading cache key "${key}":`, error.message);
      return null;
    }
  }

  /**
   * Generic set - store any value with TTL in seconds
   */
  async set(key, data, ttl) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error writing cache key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const dbsize = await redis.dbsize();
      return {
        total_keys: dbsize,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error getting cache stats:', error.message);
      return null;
    }
  }
}

module.exports = new CacheService();
