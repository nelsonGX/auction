import express from 'express';
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import config from './config/env';
import logger from './utils/logger';
import { errorHandler } from './api/middleware/errorHandler';
import { initWebSocketServer } from './websocket/server';

// Import routes
import roomRoutes from './api/routes/rooms';
import itemRoutes from './api/routes/items';
import auctionRoutes from './api/routes/auction';
import bidRoutes from './api/routes/bids';
import sessionRoutes from './api/routes/session';

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// CORS configuration with credentials
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin in development
    return callback(null, true);
  },
  credentials: true // allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'auction-app-secret-key',
  resave: true, // Changed to true to ensure session is saved on every request
  saveUninitialized: true, // Changed to true to create session on all requests
  name: 'auction.sid', // Custom cookie name for easier identification
  cookie: {
    httpOnly: true,
    secure: false, // Always set to false in development for easier debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // More permissive SameSite setting
  }
}));

// Add middleware to log session on each request (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('Session ID:', req.session.id);
    console.log('Session Data:', req.session);
    console.log('Cookies:', req.headers.cookie);
    next();
  });
}

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    query: req.query,
    params: req.params,
    body: req.body,
  });
  next();
});

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', itemRoutes);
app.use('/api/rooms', auctionRoutes);
app.use('/api/rooms', bidRoutes);
app.use('/api', sessionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
server.listen(config.port, () => {
  logger.info(`Server started on port ${config.port} in ${config.nodeEnv} mode`);
});