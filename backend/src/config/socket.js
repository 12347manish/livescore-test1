const { Server: SocketIOServer } = require('socket.io');
require('dotenv').config();

/**
 * Socket.IO Configuration - Optimized for 700+ concurrent users
 * Zero-latency broadcasting with real-time updates
 */

const io = new SocketIOServer({
  // Transport optimization
  transports: ['websocket', 'polling'],
  serveClient: false,
  
  // Websocket settings
  pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL) || 25000,
  pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT) || 60000,
  
  // Buffer settings
  maxHttpBufferSize: 1e6,
  
  // CORS
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-trading-domain.com'
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },

  // Performance
  perMessageDeflate: {
    threshold: 1024
  },

  // Connection settings
  connectTimeout: 45000,
  allowUpgrades: true
});

// Connection metrics
let connectionMetrics = {
  total_connections: 0,
  connections_by_sport: {
    football: 0,
    cricket: 0
  },
  connections_by_room: {},
  last_update: Date.now(),
  peak_connections: 0
};

/**
 * Connection handler
 */
io.on('connection', (socket) => {
  connectionMetrics.total_connections++;
  
  // Track peak
  if (connectionMetrics.total_connections > connectionMetrics.peak_connections) {
    connectionMetrics.peak_connections = connectionMetrics.total_connections;
  }

  console.log(`✅ Client connected: ${socket.id} (Total: ${connectionMetrics.total_connections})`);

  /**
   * Subscribe to sport
   */
  socket.on('subscribe', (sport) => {
    const validSports = ['football', 'cricket'];
    
    if (!validSports.includes(sport)) {
      socket.emit('error', 'Invalid sport');
      return;
    }

    socket.join(`sport:${sport}`);
    connectionMetrics.connections_by_sport[sport]++;
    
    if (!connectionMetrics.connections_by_room[`sport:${sport}`]) {
      connectionMetrics.connections_by_room[`sport:${sport}`] = 0;
    }
    connectionMetrics.connections_by_room[`sport:${sport}`]++;

    console.log(`👤 User subscribed to ${sport}`);

    socket.emit('subscribed', {
      sport,
      timestamp: Date.now()
    });
  });

  /**
   * Watch specific match
   */
  socket.on('watch_match', (fixtureId) => {
    socket.join(`match:${fixtureId}`);
    
    if (!connectionMetrics.connections_by_room[`match:${fixtureId}`]) {
      connectionMetrics.connections_by_room[`match:${fixtureId}`] = 0;
    }
    connectionMetrics.connections_by_room[`match:${fixtureId}`]++;

    socket.emit('watching', {
      fixture_id: fixtureId,
      timestamp: Date.now()
    });
  });

  /**
   * Unsubscribe from sport
   */
  socket.on('unsubscribe', (sport) => {
    socket.leave(`sport:${sport}`);
    if (connectionMetrics.connections_by_sport[sport] > 0) {
      connectionMetrics.connections_by_sport[sport]--;
    }
    
    if (connectionMetrics.connections_by_room[`sport:${sport}`] > 0) {
      connectionMetrics.connections_by_room[`sport:${sport}`]--;
    }
  });

  /**
   * Stop watching match
   */
  socket.on('stop_watching', (fixtureId) => {
    socket.leave(`match:${fixtureId}`);
    
    if (connectionMetrics.connections_by_room[`match:${fixtureId}`] > 0) {
      connectionMetrics.connections_by_room[`match:${fixtureId}`]--;
    }
  });

  /**
   * Disconnect handler
   */
  socket.on('disconnect', () => {
    connectionMetrics.total_connections--;
    console.log(`❌ Client disconnected (Total: ${connectionMetrics.total_connections})`);
  });

  /**
   * Heartbeat
   */
  socket.emit('heartbeat', {
    server_time: Date.now(),
    connection_id: socket.id,
    connection_count: connectionMetrics.total_connections
  });
});

module.exports = { io, connectionMetrics };
