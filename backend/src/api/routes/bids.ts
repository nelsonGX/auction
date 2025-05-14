import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyParticipant, RoomRequest } from '../middleware/roomAuth';
import bidService from '../../services/bid';

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
      
      // Emit WebSocket event (will implement later)
      // websocket.emitToRoom(req.params.roomId, 'participant:join', participant);
      
      res.status(201).json(participant);
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
    body('username').notEmpty().withMessage('Username is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid bid amount is required'),
  ]),
  roomExists,
  verifyParticipant,
  async (req: RoomRequest, res, next) => {
    try {
      const bidData = {
        amount: parseFloat(req.body.amount),
        participantId: req.body.participantId,
        roomId: req.params.roomId,
      };
      
      const result = await bidService.placeBid(bidData);
      
      // Emit WebSocket event (will implement later)
      // websocket.emitToRoom(req.params.roomId, 'item:bid', result);
      
      res.json(result);
    } catch (error) {
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