const Redis = require('ioredis');
require('dotenv').config();

/**
 * Redis Connection - Optimized for trading platform
 * Features:
 * - Connection pooling
 * - Auto-reconnection
 * - Zero-latency performance
 * - Memory efficient
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  
  // Connection optimization
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  
  // Retry strategy
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // TCP settings
  lazyConnect: false,
  family: 4,
  
  // Performance
  commandTimeout: 5000
});

// Connection events
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis ready for commands');
});

// Graceful disconnect
process.on('SIGTERM', async () => {
  await redis.quit();
});

module.exports = redis;
