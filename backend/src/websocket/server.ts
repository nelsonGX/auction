import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

export class WebSocketServer {
  private io: Server;
  private roomNamespace: any;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    // Create a namespace for auction rooms
    this.roomNamespace = this.io.of('/auction-rooms');

    // Initialize connection handling
    this.initialize();
  }

  private initialize(): void {
    // Handle new connections
    this.roomNamespace.on('connection', (socket: Socket) => {
      logger.info(`New client connected: ${socket.id}`);

      // Join a specific auction room
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        logger.debug(`Client ${socket.id} joined room: ${roomId}`);
      });

      // Leave a specific auction room
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        logger.debug(`Client ${socket.id} left room: ${roomId}`);
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit an event to all clients in a specific room
  public emitToRoom(roomId: string, event: string, data: any): void {
    this.roomNamespace.to(roomId).emit(event, data);
    logger.debug(`Emitted ${event} to room ${roomId}`, { data });
  }

  // Emit an event to all connected clients
  public emitToAll(event: string, data: any): void {
    this.roomNamespace.emit(event, data);
    logger.debug(`Emitted ${event} to all clients`, { data });
  }
}

// Singleton instance to be initialized when the HTTP server is created
let webSocketServer: WebSocketServer;

// Initialize the WebSocket server with the HTTP server
export const initWebSocketServer = (httpServer: HttpServer): WebSocketServer => {
  webSocketServer = new WebSocketServer(httpServer);
  return webSocketServer;
};

// Get the WebSocket server instance
export const getWebSocketServer = (): WebSocketServer => {
  if (!webSocketServer) {
    throw new Error('WebSocket server not initialized');
  }
  return webSocketServer;
};