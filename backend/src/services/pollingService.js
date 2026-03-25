const scoreService = require('./scoreService');
const { io } = require('../config/socket');
require('dotenv').config();

/**
 * Polling Service - Adaptive polling with fallback
 * Primary: Webhooks
 * Secondary: Polling with OPTIMIZED intervals
 */

class PollingService {
  
  constructor() {
    // OPTIMIZED polling intervals from environment
    this.pollingIntervalLive = parseInt(process.env.POLLING_INTERVAL_LIVE) || 1000;      // 1s
    this.pollingIntervalNoLive = parseInt(process.env.POLLING_INTERVAL_NO_LIVE) || 10000; // 10s
    this.currentInterval = this.pollingIntervalNoLive;
    this.pollingJob = null;
    this.lastScores = {
      football: null,
      cricket: null
    };
  }

  /**
   * Start polling service with OPTIMIZED intervals
   */
  async start() {
    console.log(`\n🔄 Polling Service Initialized:`);
    console.log(`   Live matches: every ${this.pollingIntervalLive}ms (CHANGED from 5000ms)`);
    console.log(`   No live: every ${this.pollingIntervalNoLive}ms (CHANGED from 30000ms)\n`);

    await this.poll();

    this.pollingJob = setInterval(async () => {
      await this.poll();
    }, this.currentInterval);
  }

  /**
   * Poll live scores
   */
  async poll() {
    try {
      const [footballResult, cricketResult] = await Promise.all([
        scoreService.getLiveFootballScores(),
        scoreService.getLiveCricketScores()
      ]);

      // Detect changes and broadcast
      if (footballResult?.data) {
        await this.detectAndBroadcastChanges('football', footballResult.data);
      }

      if (cricketResult?.data) {
        await this.detectAndBroadcastChanges('cricket', cricketResult.data);
      }

      // Adjust polling interval based on live matches
      this.adjustPollingInterval();

    } catch (error) {
      console.error('❌ Polling error:', error.message);
    }
  }

  /**
   * Detect changes and broadcast
   */
  async detectAndBroadcastChanges(sport, newScores) {
    const oldScores = this.lastScores[sport];

    if (!oldScores) {
      this.lastScores[sport] = newScores;
      return;
    }

    // Detect score changes
    const changes = newScores.filter((match, index) => {
      const oldMatch = oldScores[index];
      return !oldMatch || JSON.stringify(oldMatch.score) !== JSON.stringify(match.score);
    });

    if (changes.length > 0) {
      io.to(`sport:${sport}`).emit('scores_updated', {
        sport,
        changes,
        total_matches: newScores.length,
        timestamp: Date.now()
      });

      console.log(`✅ Polling: ${changes.length} score changes broadcasted`);
    }

    this.lastScores[sport] = newScores;
  }

  /**
   * Adjust polling interval based on live matches
   */
  adjustPollingInterval() {
    const liveMatches = (this.lastScores.football?.length || 0) + 
                       (this.lastScores.cricket?.length || 0);

    if (liveMatches > 0) {
      // LIVE matches detected - poll every 1 second
      if (this.currentInterval !== this.pollingIntervalLive) {
        clearInterval(this.pollingJob);
        this.currentInterval = this.pollingIntervalLive;
        
        this.pollingJob = setInterval(async () => {
          await this.poll();
        }, this.currentInterval);
        
        console.log(`⚡ LIVE MATCHES DETECTED - Polling every ${this.pollingIntervalLive}ms`);
      }
    } else {
      // NO live matches - poll every 10 seconds (save quota)
      if (this.currentInterval !== this.pollingIntervalNoLive) {
        clearInterval(this.pollingJob);
        this.currentInterval = this.pollingIntervalNoLive;
        
        this.pollingJob = setInterval(async () => {
          await this.poll();
        }, this.currentInterval);
        
        console.log(`😴 NO LIVE MATCHES - Polling every ${this.pollingIntervalNoLive}ms`);
      }
    }
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.pollingJob) {
      clearInterval(this.pollingJob);
      console.log('❌ Polling service stopped');
    }
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      active: !!this.pollingJob,
      current_interval: this.currentInterval,
      last_scores: {
        football_count: this.lastScores.football?.length || 0,
        cricket_count: this.lastScores.cricket?.length || 0
      }
    };
  }
}

module.exports = new PollingService();
