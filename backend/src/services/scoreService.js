const sportmonksClient = require('../config/sportmonks');
const cacheService = require('./cacheService');
const mockScoreService = require('./mockScoreService');
require('dotenv').config();

// Use optimized TTLs from environment
const CACHE_TTL = {
  LIVE_SCORES: parseInt(process.env.CACHE_LIVE_SCORES_TTL) || 15,      // 15s - Optimized
  MATCH_DETAILS: parseInt(process.env.CACHE_MATCH_DETAILS_TTL) || 45    // 45s - Optimized
};

/**
 * Score Service - Fetches and manages scores from Sportmonks
 * Optimized for zero-latency trading platform
 */

class ScoreService {
  
  /**
   * Get live football scores with optimized caching
   */
  async getLiveFootballScores() {
    try {
      if (process.env.USE_DUMMY_DATA === 'true') {
        return mockScoreService.getLiveFootballScores();
      }

      // Check cache first
      let scores = await cacheService.getLiveScores('football');

      if (scores) {
        return {
          success: true,
          source: 'cache',
          data: scores.data,
          count: scores.data?.length || 0,
          timestamp: Date.now(),
          cached_at: scores.timestamp,
          cache_ttl: CACHE_TTL.LIVE_SCORES
        };
      }

      // Cache miss - fetch from API
      console.log('📡 Fetching football scores from Sportmonks API...');
      const startTime = Date.now();

      const apiResponse = await sportmonksClient.getFootballLiveScores();

      const endTime = Date.now();
      const fetchTime = endTime - startTime;

      console.log(`⚡ API Response time: ${fetchTime}ms`);

      // Store rate limits
      if (apiResponse.rateLimit) {
        await cacheService.setRateLimit(
          'Fixture',
          apiResponse.rateLimit.remaining,
          apiResponse.rateLimit.resetTime
        );
      }

      // Store in cache with optimized TTL
      await cacheService.setLiveScores('football', {
        data: apiResponse.data,
        timestamp: apiResponse.timestamp,
        rateLimit: apiResponse.rateLimit
      }, CACHE_TTL.LIVE_SCORES);

      return {
        success: true,
        source: 'api',
        data: apiResponse.data,
        count: apiResponse.data?.length || 0,
        fetch_time: fetchTime,
        rate_limit: apiResponse.rateLimit,
        cache_ttl: CACHE_TTL.LIVE_SCORES,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error fetching football scores:', error.message);
      throw error;
    }
  }

  /**
   * Get live cricket scores with optimized caching
   */
  async getLiveCricketScores() {
    try {
      if (process.env.USE_DUMMY_DATA === 'true') {
        return mockScoreService.getLiveCricketScores();
      }

      // Check cache first
      let scores = await cacheService.getLiveScores('cricket');

      if (scores) {
        return {
          success: true,
          source: 'cache',
          data: scores.data,
          count: scores.data?.length || 0,
          timestamp: Date.now(),
          cached_at: scores.timestamp,
          cache_ttl: CACHE_TTL.LIVE_SCORES
        };
      }

      // Cache miss - fetch from API
      console.log('📡 Fetching cricket scores from Sportmonks API...');
      const startTime = Date.now();

      const apiResponse = await sportmonksClient.getCricketLiveScores();

      const endTime = Date.now();
      const fetchTime = endTime - startTime;

      console.log(`⚡ API Response time: ${fetchTime}ms`);

      // Store rate limits
      if (apiResponse.rateLimit) {
        await cacheService.setRateLimit(
          'Fixture',
          apiResponse.rateLimit.remaining,
          apiResponse.rateLimit.resetTime
        );
      }

      // Store in cache with optimized TTL
      await cacheService.setLiveScores('cricket', {
        data: apiResponse.data,
        timestamp: apiResponse.timestamp,
        rateLimit: apiResponse.rateLimit
      }, CACHE_TTL.LIVE_SCORES);

      return {
        success: true,
        source: 'api',
        data: apiResponse.data,
        count: apiResponse.data?.length || 0,
        fetch_time: fetchTime,
        rate_limit: apiResponse.rateLimit,
        cache_ttl: CACHE_TTL.LIVE_SCORES,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error fetching cricket scores:', error.message);
      throw error;
    }
  }

  /**
   * Get match details by fixture ID
   */
  async getMatchDetails(fixtureId, sport = 'football') {
    try {
      if (process.env.USE_DUMMY_DATA === 'true') {
        return mockScoreService.getMatchDetails(fixtureId, sport);
      }

      // Check cache
      let details = await cacheService.getMatchDetails(fixtureId, sport);

      if (details) {
        return {
          success: true,
          source: 'cache',
          data: details,
          timestamp: Date.now()
        };
      }

      // Fetch from API
      const apiResponse = await sportmonksClient.getFixtureDetails(fixtureId);

      // Cache result with optimized TTL
      await cacheService.setMatchDetails(fixtureId, sport, apiResponse.data, CACHE_TTL.MATCH_DETAILS);

      return {
        success: true,
        source: 'api',
        data: apiResponse.data,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`❌ Error fetching match ${fixtureId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get match events
   */
  async getMatchEvents(fixtureId) {
    try {
      return await cacheService.getMatchEvents(fixtureId);

    } catch (error) {
      console.error(`❌ Error fetching events for ${fixtureId}:`, error.message);
      return [];
    }
  }
}

module.exports = new ScoreService();
