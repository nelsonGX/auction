import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { UnauthorizedError, NotFoundError } from '../../utils/errors';
import prisma from '../../utils/prisma';
import authCache from '../../utils/authCache';

// Add session types
declare module 'express-session' {
  interface SessionData {
    hostRooms: Record<string, string>; // Map of roomId -> participantId
    isAuthenticated: boolean;
  }
}

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

// Middleware to verify room password and create a session
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

    // Initialize session structure if needed
    if (!req.session.hostRooms) {
      req.session.hostRooms = {};
    }

    // Password matches, mark as host and set session
    req.isHost = true;
    
    // Store host access in session
    const participant = await prisma.participant.findFirst({
      where: {
        roomId: req.room.id,
        isHost: true
      }
    });

    if (participant) {
      // Store in session
      req.session.hostRooms[req.room.id] = participant.id;
      req.session.isAuthenticated = true;
      await req.session.save();
      
      // Store in memory cache as well
      authCache.setHostAuth(req.room.id, participant.id);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to verify host session
export const verifyHostSession = async (req: RoomRequest, res: Response, next: NextFunction) => {
  const { roomId } = req.params;
  
  try {
    console.log(`[verifyHostSession] Checking auth for room: ${roomId}`);
    console.log(`[verifyHostSession] Session exists:`, !!req.session);
    console.log(`[verifyHostSession] Cookies:`, req.headers.cookie);
    
    // Check in-memory cache first (fastest way)
    const cachedHostId = authCache.getHostId(roomId);
    if (cachedHostId) {
      console.log(`[verifyHostSession] Found host ID in memory cache: ${cachedHostId}`);
      
      // Verify the participant exists and is a host (quick validation)
      const participant = await prisma.participant.findUnique({
        where: { id: cachedHostId },
      });
      
      if (participant && participant.isHost && participant.roomId === roomId) {
        console.log(`[verifyHostSession] Valid host from memory cache`);
        req.isHost = true;
        return next();
      } else {
        console.log(`[verifyHostSession] Cached participant invalid, removing from cache`);
        authCache.clearHostAuth(roomId);
      }
    }
    
    // Then check session
    if (req.session) {
      console.log(`[verifyHostSession] Session data:`, {
        id: req.session.id,
        isAuthenticated: req.session.isAuthenticated,
        hostRooms: req.session.hostRooms
      });
    }
    
    // Check if user has an active session with host privileges for this room
    if (req.session.hostRooms && req.session.hostRooms[roomId]) {
      const participantId = req.session.hostRooms[roomId];
      console.log(`[verifyHostSession] Found participant ID in session: ${participantId}`);
      
      // Verify the participant exists and is a host
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      
      console.log(`[verifyHostSession] Participant lookup result:`, participant);
      
      if (participant && participant.isHost) {
        // Session is valid, mark as host
        console.log(`[verifyHostSession] Valid host session confirmed`);
        // Store in memory cache for future requests
        authCache.setHostAuth(roomId, participantId);
        req.isHost = true;
        return next();
      } else {
        console.log(`[verifyHostSession] Participant not found or not a host`);
      }
    } else {
      console.log(`[verifyHostSession] No host room data found in session for this room`);
    }
    
    // If no valid session, check if password was provided as fallback
    if (req.body.password) {
      console.log(`[verifyHostSession] No session but password provided, attempting password auth`);
      return verifyRoomPassword(req, res, next);
    }
    
    // Check for custom host headers
    const hostId = req.headers['x-host-id'];
    const headerRoomId = req.headers['x-room-id'];
    
    if (hostId && headerRoomId === roomId) {
      console.log(`[verifyHostSession] Found X-Host-ID header: ${hostId}`);
      
      try {
        // Verify the participant exists and is a host
        const participant = await prisma.participant.findUnique({
          where: { id: hostId as string },
        });
        
        console.log(`[verifyHostSession] Header-based participant lookup:`, participant);
        
        if (participant && participant.isHost && participant.roomId === roomId) {
          console.log(`[verifyHostSession] Valid host header authentication`);
          
          // Save to in-memory cache
          authCache.setHostAuth(roomId, hostId as string);
          
          // Save to session for future requests
          if (!req.session.hostRooms) {
            req.session.hostRooms = {};
          }
          req.session.hostRooms[roomId] = hostId as string;
          req.session.isAuthenticated = true;
          req.session.save(); // Don't await to avoid slowing down the response
          
          // Allow the request to proceed
          req.isHost = true;
          return next();
        }
      } catch (error) {
        console.error(`[verifyHostSession] Error verifying header auth:`, error);
      }
    }
    
    // Check for test mode (for development only)
    if (process.env.NODE_ENV === 'development' && req.headers['x-bypass-auth'] === 'true') {
      console.log(`[verifyHostSession] Development bypass auth header detected`);
      req.isHost = true;
      return next();
    }
    
    // No valid session or password, unauthorized
    console.log(`[verifyHostSession] Authentication failed, no valid session or password`);
    
    // Provide more detailed error information for debugging
    const sessionInfo = {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      hasHostRooms: !!req.session?.hostRooms,
      roomIdInParams: roomId,
      method: req.method,
      path: req.path,
      cookies: req.headers.cookie
    };
    
    return next(new UnauthorizedError('Host authentication required', sessionInfo));
  } catch (error) {
    console.error(`[verifyHostSession] Error:`, error);
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