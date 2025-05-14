import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import prisma from '../../utils/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import authCache from '../../utils/authCache';

const router = Router();

/**
 * Endpoint to establish a session from localStorage credentials
 * This helps users who authenticated previously via localStorage
 * to establish a proper session without re-entering password
 */
router.post(
  '/reconnect-session',
  validate([
    body('roomId').isUUID().withMessage('Valid room ID is required'),
    body('hostId').isString().withMessage('Host ID is required'),
  ]),
  async (req, res, next) => {
    try {
      const { roomId, hostId } = req.body;

      console.log(`[reconnect-session] Attempting to find participant with id: ${hostId}`);
      
      // Verify that the host participant exists and is associated with the room
      const participant = await prisma.participant.findUnique({
        where: { 
          id: hostId,
        },
        include: {
          room: true,
        },
      });

      console.log(`[reconnect-session] Participant lookup result:`, participant);

      if (!participant) {
        // If not found by ID, try to find host participant by room
        console.log(`[reconnect-session] Participant not found by ID, trying to find host for room: ${roomId}`);
        const hostParticipant = await prisma.participant.findFirst({
          where: {
            roomId: roomId,
            isHost: true,
          }
        });
        
        console.log(`[reconnect-session] Host participant by room lookup:`, hostParticipant);
        
        if (hostParticipant) {
          console.log(`[reconnect-session] Using host participant found by room`);
          // Use this participant instead
          hostId = hostParticipant.id;
        } else {
          throw new NotFoundError('Host not found');
        }
      }

      // Check room association and host status
      let isValidHost = false;
      let usedParticipant: any = participant;
      
      if (participant) {
        if (participant.roomId !== roomId) {
          throw new BadRequestError('Host is not associated with this room');
        }

        if (!participant.isHost) {
          throw new BadRequestError('Participant is not a host');
        }
        
        isValidHost = true;
      } else {
        // We must have found a host by room - fetch complete data
        usedParticipant = await prisma.participant.findUnique({
          where: { id: hostId },
          include: { room: true }
        });
        
        console.log(`[reconnect-session] Loaded alternative host:`, usedParticipant);
        
        if (usedParticipant && usedParticipant.isHost) {
          isValidHost = true;
        } else {
          throw new BadRequestError('Could not find valid host participant');
        }
      }
      
      if (!isValidHost) {
        throw new BadRequestError('Failed to validate host permissions');
      }

      // Establish the session
      console.log(`[reconnect-session] Establishing session for hostId: ${hostId}, roomId: ${roomId}`);
      
      if (!req.session.hostRooms) {
        req.session.hostRooms = {};
      }

      req.session.hostRooms[roomId] = hostId;
      req.session.isAuthenticated = true;
      await req.session.save();
      
      // Also save to memory cache
      authCache.setHostAuth(roomId, hostId);
      
      console.log(`[reconnect-session] Session saved, id: ${req.session.id}`);
      console.log(`[reconnect-session] Auth also saved to memory cache`);

      res.json({
        success: true,
        authenticated: true,
        hostId: hostId,
        sessionId: req.session.id
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;