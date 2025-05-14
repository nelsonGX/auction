import { Router } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyHostSession } from '../middleware/roomAuth';
import auctionService from '../../services/auction';
import * as wsHandlers from '../../websocket/handlers';

const router = Router();

// Start the auction (requires host authentication)
router.post(
  '/:roomId/start',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req, res, next) => {
    try {
      const room = await auctionService.startAuction(req.params.roomId);
      
      // Emit WebSocket event with full room data
      wsHandlers.emitRoomStart(req.params.roomId, {
        room,
        currentItem: room.currentItem,
        currentItemId: room.currentItemId
      });
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Move to next item (requires host authentication)
router.post(
  '/:roomId/next',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req, res, next) => {
    try {
      const room = await auctionService.moveToNextItem(req.params.roomId);
      
      // Emit WebSocket event with full context
      wsHandlers.emitItemNext(req.params.roomId, {
        room,
        item: room.currentItem
      });
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// End current item auction (requires host authentication)
router.post(
  '/:roomId/end-current',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req, res, next) => {
    try {
      const item = await auctionService.endCurrentItem(req.params.roomId);
      
      // Emit WebSocket event with winner info
      wsHandlers.emitItemManuallyEnded(req.params.roomId, { 
        item,
        winner: item.winner
      });
      
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

// End the entire auction (requires host authentication)
router.post(
  '/:roomId/end',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req, res, next) => {
    try {
      const room = await auctionService.endAuction(req.params.roomId);
      
      // Emit WebSocket event with full context
      wsHandlers.emitRoomEnd(req.params.roomId, {
        room,
        items: room.items 
      });
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

export default router;