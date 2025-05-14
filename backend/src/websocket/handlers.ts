import { getWebSocketServer } from './server';
import logger from '../utils/logger';

/**
 * WebSocket event handlers for auction events
 * These functions are called from API routes to emit events to clients
 */

// Room events
export const emitRoomStart = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'room:start', data);
    logger.info(`Emitted room:start event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting room:start event', { error, roomId });
  }
};

export const emitRoomEnd = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'room:end', data);
    logger.info(`Emitted room:end event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting room:end event', { error, roomId });
  }
};

export const emitParticipantJoin = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'participant:join', data);
    logger.info(`Emitted participant:join event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting participant:join event', { error, roomId });
  }
};

// Item events
export const emitItemNext = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'item:next', data);
    logger.info(`Emitted item:next event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting item:next event', { error, roomId });
  }
};

export const emitItemBid = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'item:bid', data);
    logger.info(`Emitted item:bid event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting item:bid event', { error, roomId });
  }
};

export const emitItemTimeoutWarning = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'item:timeout:warning', data);
    logger.info(`Emitted item:timeout:warning event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting item:timeout:warning event', { error, roomId });
  }
};

export const emitItemSold = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'item:sold', data);
    logger.info(`Emitted item:sold event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting item:sold event', { error, roomId });
  }
};

export const emitItemManuallyEnded = (roomId: string, data: any) => {
  try {
    getWebSocketServer().emitToRoom(roomId, 'item:manually_ended', data);
    logger.info(`Emitted item:manually_ended event for room ${roomId}`);
  } catch (error) {
    logger.error('Error emitting item:manually_ended event', { error, roomId });
  }
};