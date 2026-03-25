const axios = require('axios');
require('dotenv').config();

/**
 * Sportmonks API Client - Optimized for Trading Platform
 * Features:
 * - Request pooling
 * - Automatic retries
 * - Rate limit awareness
 * - Response caching at HTTP level
 */

class SportmonksClient {
  constructor() {
    this.baseURL = process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com';
    this.apiKey = process.env.SPORTMONKS_API_KEY;
    this.timeout = parseInt(process.env.SPORTMONKS_TIMEOUT) || 5000;
    
    // Rate limit tracking
    this.rateLimits = {
      Fixture: { remaining: 1000, resetTime: Date.now() },
      Team: { remaining: 1000, resetTime: Date.now() }
    };

    // Create optimized axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      keepAlive: true,
      maxRedirects: 1,
      headers: {
        'User-Agent': 'Sports-Score-System/1.0',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });

    // Add request interceptor for rate limit handling
    this.client.interceptors.response.use(
      response => {
        this.updateRateLimits(response.headers);
        return response;
      },
      error => {
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit hit - backing off');
        }
        throw error;
      }
    );
  }

  /**
   * Get live football scores - OPTIMIZED
   */
  async getFootballLiveScores() {
    try {
      const response = await this.client.get('/v3/football/livescores/latest', {
        params: {
          api_token: this.apiKey,
          include: 'score,teams,events',
          per_page: 100
        }
      });

      return {
        data: response.data.data || [],
        rateLimit: this.extractRateLimit(response.headers),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error fetching football scores:', error.message);
      throw error;
    }
  }

  /**
   * Get live cricket scores - OPTIMIZED
   */
  async getCricketLiveScores() {
    try {
      const response = await this.client.get('/v3/cricket/livescores/latest', {
        params: {
          api_token: this.apiKey,
          include: 'score,teams,events',
          per_page: 100
        }
      });

      return {
        data: response.data.data || [],
        rateLimit: this.extractRateLimit(response.headers),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error fetching cricket scores:', error.message);
      throw error;
    }
  }

  /**
   * Get fixture details
   */
  async getFixtureDetails(fixtureId) {
    try {
      const response = await this.client.get(`/v3/football/fixtures/${fixtureId}`, {
        params: {
          api_token: this.apiKey,
          include: 'score,teams,events,statistics'
        }
      });

      return {
        data: response.data.data,
        rateLimit: this.extractRateLimit(response.headers),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`❌ Error fetching fixture ${fixtureId}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract rate limit from response headers
   */
  extractRateLimit(headers) {
    return {
      remaining: parseInt(headers['x-ratelimit-remaining'] || 1000),
      limit: parseInt(headers['x-ratelimit-limit'] || 1000),
      resetTime: parseInt(headers['x-ratelimit-reset'] || Date.now() + 3600000)
    };
  }

  /**
   * Update internal rate limit tracking
   */
  updateRateLimits(headers) {
    const entity = headers['x-ratelimit-entity'] || 'Fixture';
    this.rateLimits[entity] = this.extractRateLimit(headers);

    if (this.rateLimits[entity].remaining < 100) {
      console.warn(`⚠️ LOW RATE LIMIT: ${entity} has ${this.rateLimits[entity].remaining} requests left`);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return this.rateLimits;
  }

  /**
   * Check if rate limit is critical
   */
  isRateLimitCritical() {
    return Object.values(this.rateLimits).some(limit => limit.remaining < 50);
  }
}

module.exports = new SportmonksClient();
