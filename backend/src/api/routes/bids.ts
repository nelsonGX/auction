import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyParticipant, RoomRequest } from '../middleware/roomAuth';
import bidService from '../../services/bid';
import * as wsHandlers from '../../websocket/handlers';
import prisma from '../../utils/prisma';

const router = Router();

// Join a room as participant
router.post(
  '/:roomId/join',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    body('username').notEmpty().withMessage('Username is required'),
  ]),
  async (req, res, next) => {
    try {
      const participant = await bidService.joinRoom(
        req.params.roomId,
        req.body.username,
        false // Not a host
      );
      
      // Emit WebSocket event
      wsHandlers.emitParticipantJoin(req.params.roomId, { participant });
      
      // Format the response to match what the frontend expects
      res.status(201).json({
        participantId: participant.id,
        ...participant
      });
    } catch (error) {
      next(error);
    }
  }
);

// Place bid on current item
router.post(
  '/:roomId/bid',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    body('participantId').isUUID().withMessage('Valid participant ID is required'),
    body('itemId').isUUID().withMessage('Valid item ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid bid amount is required'),
  ]),
  roomExists,
  async (req: RoomRequest, res, next) => {
    try {
      const { amount, participantId, itemId } = req.body;
      const { roomId } = req.params;
      
      console.log(`Placing bid: Room ${roomId}, Item ${itemId}, Participant ${participantId}, Amount ${amount}`);
      
      // Verify that the participant exists
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });

      if (!participant) {
        console.error(`Participant ${participantId} not found`);
        return res.status(404).json({ message: 'Participant not found' });
      }

      if (participant.roomId !== roomId) {
        console.error(`Participant ${participantId} not in room ${roomId}`);
        return res.status(403).json({ message: 'Participant not in this room' });
      }
      
      const bidData = {
        amount: parseFloat(amount),
        participantId,
        roomId,
        itemId,
      };
      
      const result = await bidService.placeBid(bidData);
      
      // Emit WebSocket event
      wsHandlers.emitItemBid(roomId, result);
      
      // Return a simplified response to the client
      res.json({
        success: true,
        bid: result.bid
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      next(error);
    }
  }
);

// Get bids for an item
router.get(
  '/:roomId/items/:itemId/bids',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    param('itemId').isUUID().withMessage('Valid item ID is required'),
  ]),
  async (req, res, next) => {
    try {
      const bids = await bidService.getBidsByItemId(req.params.itemId);
      res.json(bids);
    } catch (error) {
      next(error);
    }
  }
);

// Get participants in a room
router.get(
  '/:roomId/participants',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  async (req, res, next) => {
    try {
      const participants = await bidService.getParticipantsByRoomId(req.params.roomId);
      res.json(participants);
    } catch (error) {
      next(error);
    }
  }
);

export default router;