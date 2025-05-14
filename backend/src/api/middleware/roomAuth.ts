import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { UnauthorizedError, NotFoundError } from '../../utils/errors';
import prisma from '../../utils/prisma';

// Define custom request type with room property
export interface RoomRequest extends Request {
  room?: any;
  isHost?: boolean;
}

// Middleware to verify room exists
export const roomExists = async (req: RoomRequest, res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  
  try {
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Attach room to request object for use in subsequent middleware or route handlers
    req.room = room;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to verify room password
export const verifyRoomPassword = async (req: RoomRequest, res: Response, next: NextFunction) => {
  // Room should be attached by the roomExists middleware
  if (!req.room) {
    return next(new NotFoundError('Auction room not found'));
  }

  const { password } = req.body;

  if (!password) {
    return next(new UnauthorizedError('Password is required'));
  }

  try {
    // Compare provided password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, req.room.password);

    if (!isPasswordValid) {
      return next(new UnauthorizedError('Invalid password'));
    }

    // Password matches, mark as host
    req.isHost = true;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to verify participant
export const verifyParticipant = async (req: RoomRequest, res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  const { username } = req.body;

  if (!username) {
    return next(new UnauthorizedError('Username is required'));
  }

  try {
    const participant = await prisma.participant.findUnique({
      where: {
        username_roomId: {
          username,
          roomId,
        },
      },
    });

    if (!participant) {
      return next(new UnauthorizedError('Participant not found'));
    }

    // Attach participant to request
    req.body.participantId = participant.id;
    req.isHost = participant.isHost;
    
    next();
  } catch (error) {
    next(error);
  }
};