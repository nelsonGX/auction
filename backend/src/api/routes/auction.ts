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
      
      // Import prisma to fetch the current item if needed
      const prisma = require('../../utils/prisma').default;
      
      // Always fetch current item explicitly if we have an ID
      let currentItem = null;
      if (room.currentItemId) {
        currentItem = await prisma.auctionItem.findUnique({
          where: { id: room.currentItemId }
        });
      }
      
      // Emit WebSocket event with full room data
      wsHandlers.emitRoomStart(req.params.roomId, {
        room,
        currentItem,
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
      
      // Import prisma to fetch the current item if needed
      const prisma = require('../../utils/prisma').default;
      
      // Always fetch the current item explicitly using the currentItemId
      if (room.currentItemId) {
        const currentItem = await prisma.auctionItem.findUnique({
          where: { id: room.currentItemId }
        });
        
        // Emit WebSocket event with full context and explicit item data
        wsHandlers.emitItemNext(req.params.roomId, {
          room,
          item: currentItem || undefined
        });
      } else {
        // No current item, just send the room
        wsHandlers.emitItemNext(req.params.roomId, {
          room,
          item: null
        });
      }
      
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

// Get auction summary (available to all participants)
router.get(
  '/:roomId/summary',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  async (req, res, next) => {
    try {
      const summary = await auctionService.getAuctionSummary(req.params.roomId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

export default router;