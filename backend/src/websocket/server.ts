import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

export class WebSocketServer {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
      path: '/ws',
    });

    // Initialize connection handling
    this.initialize();
  }

  private initialize(): void {
    // Handle new connections
    this.io.on('connection', (socket: Socket) => {
      const roomId = socket.handshake.query.roomId as string;
      const participantId = socket.handshake.query.participantId as string;
      
      logger.info(`New client connected: ${socket.id}`, { roomId, participantId });

      if (roomId) {
        socket.join(roomId);
        logger.debug(`Client ${socket.id} joined room: ${roomId}`);
      }

      // Handle disconnections
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
      
      // Verify room connection for debugging
      socket.on('verify-room', (data, callback) => {
        const { roomId } = data;
        const rooms = Array.from(socket.rooms);
        const isInRoom = rooms.includes(roomId);
        logger.info(`Room verification request from ${socket.id}`, { 
          requestedRoom: roomId, 
          clientRooms: rooms,
          isInRoom 
        });
        
        if (callback && typeof callback === 'function') {
          callback({ 
            success: true, 
            isInRoom,
            rooms
          });
        }
      });
    });
  }

  // Emit an event to all clients in a specific room
  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
    logger.debug(`Emitted ${event} to room ${roomId}`, { data });
  }

  // Emit an event to all connected clients
  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
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