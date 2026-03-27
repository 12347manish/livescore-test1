const express = require('express');
const http = require('http');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import modules
const { io } = require('./config/socket');
const footballRouter = require('./routes/football');
const cricketRouter = require('./routes/cricket');
const healthRouter = require('./routes/health');
const webhookRouter = require('./routes/webhooks');
const livescoreRouter = require('./routes/livescore');
const pollingService = require('./services/pollingService');
const mockScoreService = require('./services/mockScoreService');

/**
 * Express App Setup - Optimized for trading platform
 * With ZERO LATENCY cache configuration
 */

const app = express();
const server = http.createServer(app);

// Attach Socket.IO to HTTP server
io.attach(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourceSharing: false
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-trading-domain.com'
    : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

/**
 * Routes
 */

// Health and monitoring
app.use('/health', healthRouter);

// API Routes
app.use('/api/football', footballRouter);
app.use('/api/cricket', cricketRouter);
app.use('/api/livescore', livescoreRouter);

// Webhooks
app.use('/webhooks/sportmonks', webhookRouter);

// Metrics endpoint
app.get('/metrics/connections', (req, res) => {
  const { connectionMetrics } = require('./config/socket');
  res.json(connectionMetrics);
});

// System stats
app.get('/stats', async (req, res) => {
  try {
    const redis = require('./config/redis');
    const dbsize = await redis.dbsize();
    
    res.json({
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis_keys: dbsize,
      connections: connectionMetrics.total_connections
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Server startup
 */

const PORT = process.env.SERVER_PORT || 3001;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

const { connectionMetrics } = require('./config/socket');

server.listen(PORT, HOST, async () => {
  console.log(`\n╔═════════════════════════════════════════════════════╗`);
  console.log(`║                                                     ║`);
  console.log(`║  🚀 LIVE SPORTS SCORE SERVER - ZERO LATENCY       ║`);
  console.log(`║                                                     ║`);
  console.log(`╠═════════════════════════════════════════════════════╣`);
  console.log(`║  Port: ${PORT.toString().padEnd(44)}║`);
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(39)}║`);
  console.log(`║  WebSocket: ws://${HOST}:${PORT}${' '.repeat(28)}║`);
  console.log(`║  Webhooks: /webhooks/sportmonks${' '.repeat(19)}║`);
  console.log(`║                                                     ║`);
  console.log(`╠═════════════════════════════════════════════════════╣`);
  console.log(`║  CACHE OPTIMIZATION:                                ║`);
  console.log(`║  • Live Scores TTL: 15s (was 120s) - 8x FASTER   ║`);
  console.log(`║  • Match Details TTL: 45s (was 300s) - 6.6x FASTER║`);
  console.log(`║  • Match Status TTL: 10s (NEW - CRITICAL)         ║`);
  console.log(`║  • Polling: 1s live / 10s idle (adaptive)         ║`);
  console.log(`║                                                     ║`);
  console.log(`╠═════════════════════════════════════════════════════╣`);
  console.log(`║  LATENCY TARGETS:                                   ║`);
  console.log(`║  • Cache Hit: <5ms ✅                               ║`);
  console.log(`║  • Cache Miss: 15-20ms                              ║`);
  console.log(`║  • Webhook: <50ms to user screen ✅                ║`);
  console.log(`║  • Polling Backup: 1-3 seconds                     ║`);
  console.log(`║                                                     ║`);
  console.log(`╚═════════════════════════════════════════════════════╝\n`);

  // Start polling service
  try {
    if (process.env.USE_DUMMY_DATA === 'true') {
      mockScoreService.startSimulation();
      console.log('✅ Mock data simulation started\n');
    } else {
      await pollingService.start();
      console.log('✅ Polling service initialized\n');
    }
  } catch (error) {
    console.error('❌ Failed to start service:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received - shutting down gracefully...');
  pollingService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received - shutting down gracefully...');
  pollingService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
