/**
 * Header-based authentication utility for handling cases where sessions are not working properly
 */

import { Response, NextFunction } from 'express';
import { RoomRequest } from '../api/middleware/roomAuth';
import prisma from './prisma';
import logger from './logger';

// Check header-based authentication for host access
export const verifyHeaderAuth = async (req: RoomRequest, res: Response, next: NextFunction) => {
  const roomId = req.params.roomId;
  const hostId = req.headers['x-host-id'] as string;
  const headerRoomId = req.headers['x-room-id'] as string;
  
  if (!hostId || !headerRoomId || headerRoomId !== roomId) {
    logger.debug('Header auth failed - missing or invalid headers', {
      hostId,
      headerRoomId,
      roomId
    });
    return false;
  }
  
  try {
    // Find the participant
    const participant = await prisma.participant.findUnique({
      where: { id: hostId }
    });
    
    if (!participant) {
      logger.debug('Header auth failed - participant not found', { hostId });
      return false;
    }
    
    if (!participant.isHost) {
      logger.debug('Header auth failed - participant is not a host', { hostId });
      return false;
    }
    
    if (participant.roomId !== roomId) {
      logger.debug('Header auth failed - participant not associated with room', { 
        hostId, 
        roomId, 
        participantRoomId: participant.roomId 
      });
      return false;
    }
    
    // Authentication successful
    logger.debug('Header-based authentication successful', { hostId, roomId });
    return true;
  } catch (error) {
    logger.error('Error during header authentication', { error, hostId, roomId });
    return false;
  }
};

// Export a middleware version
export const headerAuthMiddleware = async (req: RoomRequest, res: Response, next: NextFunction) => {
  const isAuthorized = await verifyHeaderAuth(req, res, next);
  
  if (isAuthorized) {
    req.isHost = true;
    next();
  } else {
    next();
  }
};