const crypto = require('crypto');
const redis = require('../config/redis');
const { io } = require('../config/socket');
const cacheService = require('./cacheService');
require('dotenv').config();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default_secret';

/**
 * Webhook Processor - Real-time score updates
 * Zero-latency push to trading platform
 */

class WebhookProcessor {
  
  /**
   * Verify webhook signature
   */
  verifySignature(req) {
    const signature = req.headers['x-sportmonks-signature'];
    
    if (!signature) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Handle score update - REAL-TIME
   */
  async handleScoreUpdate(data) {
    try {
      const timestamp = Date.now();
      const { fixture_id, sport, score, minute, status, scorer, team } = data;

      console.log(`⚡ WEBHOOK: Score update - Fixture ${fixture_id}`);
      console.log(`  Score: ${score.home} - ${score.away} | Minute: ${minute}`);

      // Update Redis cache immediately with optimized TTL
      const cacheKey = `live_scores:${sport}`;
      let liveScores = await redis.get(cacheKey);
      liveScores = liveScores ? JSON.parse(liveScores) : { data: [] };

      const matchIndex = liveScores.data.findIndex(m => m.id === fixture_id);
      if (matchIndex !== -1) {
        const oldScore = liveScores.data[matchIndex].score;
        
        liveScores.data[matchIndex] = {
          ...liveScores.data[matchIndex],
          score,
          minute,
          status,
          updated_at: new Date().toISOString(),
          webhook_received_at: timestamp
        };

        // Check if score changed
        const scoreChanged = JSON.stringify(oldScore) !== JSON.stringify(score);

        // Re-cache with optimized TTL
        const cacheTTL = parseInt(process.env.CACHE_LIVE_SCORES_TTL) || 15;
        await redis.setex(cacheKey, cacheTTL, JSON.stringify(liveScores));

        // BROADCAST ONLY IF SCORE CHANGED (zero latency for trading)
        if (scoreChanged) {
          const updateData = {
            fixture_id,
            sport,
            score,
            minute,
            status,
            scorer,
            team,
            updated_at: timestamp,
            webhook_latency_ms: 0
          };

          // Broadcast to all users watching this sport
          io.to(`sport:${sport}`).emit('score_update', updateData);

          // Broadcast to users watching this specific match
          io.to(`match:${fixture_id}`).emit('match_score_update', updateData);

          console.log(`✅ Score update BROADCASTED [${io.engine.clientsCount} users connected]`);
        }
      }

    } catch (error) {
      console.error('❌ Error handling score update:', error.message);
    }
  }

  /**
   * Handle match event (goal, wicket, card, etc)
   */
  async handleMatchEvent(data) {
    try {
      const { fixture_id, sport, event_type, player_name, team_name, minute } = data;

      console.log(`⚡ EVENT: ${event_type} - ${player_name} (${minute}')`);

      const eventData = {
        type: event_type,
        player: player_name,
        team: team_name,
        minute,
        timestamp: Date.now()
      };

      // Store event in Redis
      await cacheService.addMatchEvent(fixture_id, eventData);

      // Broadcast event
      io.to(`match:${fixture_id}`).emit('match_event', eventData);
      io.to(`sport:${sport}`).emit('event_notification', {
        fixture_id,
        ...eventData
      });

      console.log(`✅ Event BROADCASTED`);

    } catch (error) {
      console.error('❌ Error handling match event:', error.message);
    }
  }

  /**
   * Handle match status change
   */
  async handleStatusChange(data) {
    try {
      const { fixture_id, sport, status } = data;

      console.log(`⚡ STATUS: Match ${fixture_id} - ${status}`);

      // Store status with OPTIMIZED TTL
      await cacheService.setMatchStatus(fixture_id, sport, status);

      // Broadcast status change
      io.to(`match:${fixture_id}`).emit('match_status_changed', {
        fixture_id,
        status,
        timestamp: Date.now()
      });

      io.to(`sport:${sport}`).emit('match_status_notification', {
        fixture_id,
        status,
        timestamp: Date.now()
      });

      console.log(`✅ Status change BROADCASTED`);

    } catch (error) {
      console.error('❌ Error handling status change:', error.message);
    }
  }
}

module.exports = new WebhookProcessor();
