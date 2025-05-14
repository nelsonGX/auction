import { Router } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyRoomPassword } from '../middleware/roomAuth';
import auctionService from '../../services/auction';
import * as wsHandlers from '../../websocket/handlers';

const router = Router();

// Start the auction (requires password)
router.post(
  '/:roomId/start',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const room = await auctionService.startAuction(req.params.roomId);
      
      // Emit WebSocket event
      wsHandlers.emitRoomStart(req.params.roomId, room);
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Move to next item (requires password)
router.post(
  '/:roomId/next',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const room = await auctionService.moveToNextItem(req.params.roomId);
      
      // Emit WebSocket event
      wsHandlers.emitItemNext(req.params.roomId, room);
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// End current item auction (requires password)
router.post(
  '/:roomId/end-current',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const item = await auctionService.endCurrentItem(req.params.roomId);
      
      // Emit WebSocket event
      wsHandlers.emitItemManuallyEnded(req.params.roomId, item);
      
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

// End the entire auction (requires password)
router.post(
  '/:roomId/end',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const room = await auctionService.endAuction(req.params.roomId);
      
      // Emit WebSocket event
      wsHandlers.emitRoomEnd(req.params.roomId, room);
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

export default router;