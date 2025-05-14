import express from 'express';
import http from 'http';
import cors from 'cors';
import config from './config/env';
import logger from './utils/logger';
import { errorHandler } from './api/middleware/errorHandler';
import { initWebSocketServer } from './websocket/server';

// Import routes
import roomRoutes from './api/routes/rooms';
import itemRoutes from './api/routes/items';
import auctionRoutes from './api/routes/auction';
import bidRoutes from './api/routes/bids';

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const webSocketServer = initWebSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());

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