const express = require('express');
const router = express.Router();
const redis = require('../config/redis');
const { connectionMetrics } = require('../config/socket');
const sportmonksClient = require('../config/sportmonks');
const pollingService = require('../services/pollingService');
const cacheService = require('../services/cacheService');

/**
 * Health & Monitoring Routes
 */

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const redisHealthy = await redis.ping();
    
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      components: {
        redis: redisHealthy === 'PONG' ? 'healthy' : 'unhealthy',
        websocket: 'healthy',
        sportmonks_api: 'healthy'
      },
      connections: {
        active: connectionMetrics.total_connections,
        peak: connectionMetrics.peak_connections,
        by_sport: connectionMetrics.connections_by_sport
      },
      rate_limits: sportmonksClient.getRateLimitStatus(),
      polling: pollingService.getStatus(),
      uptime: process.uptime()
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    res.json({
      connections: {
        total: connectionMetrics.total_connections,
        peak: connectionMetrics.peak_connections,
        by_sport: connectionMetrics.connections_by_sport
      },
      cache: {
        total_keys: stats?.total_keys || 0,
        timestamp: Date.now()
      },
      rate_limits: sportmonksClient.getRateLimitStatus(),
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Latency metrics endpoint
router.get('/latency', async (req, res) => {
  try {
    const stats = await cacheService.getLatencyStats();
    
    res.json({
      latency_metrics: stats,
      threshold_ms: parseInt(process.env.LATENCY_LOG_THRESHOLD) || 50,
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
