import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyRoomPassword, RoomRequest } from '../middleware/roomAuth';
import itemService from '../../services/item';

const router = Router();

// Add item to room (requires password)
router.post(
  '/:roomId/items',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    body('name').notEmpty().withMessage('Item name is required'),
    body('minPrice').isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    body('timeoutSecs').isInt({ min: 5 }).withMessage('Timeout must be at least 5 seconds'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req: RoomRequest, res, next) => {
    try {
      const itemData = {
        name: req.body.name,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        minPrice: parseFloat(req.body.minPrice),
        timeoutSecs: parseInt(req.body.timeoutSecs),
        position: req.body.position ? parseInt(req.body.position) : undefined,
        roomId: req.params.roomId,
      };

      const item = await itemService.addItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// Get all items in room (public)
router.get(
  '/:roomId/items',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  async (req, res, next) => {
    try {
      const items = await itemService.getItemsByRoomId(req.params.roomId);
      res.json(items);
    } catch (error) {
      next(error);
    }
  }
);

// Update item (requires password)
router.put(
  '/:roomId/items/:itemId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    param('itemId').isUUID().withMessage('Valid item ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        minPrice: req.body.minPrice !== undefined ? parseFloat(req.body.minPrice) : undefined,
        timeoutSecs: req.body.timeoutSecs !== undefined ? parseInt(req.body.timeoutSecs) : undefined,
      };

      const item = await itemService.updateItem(req.params.itemId, updateData);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

// Remove item (requires password)
router.delete(
  '/:roomId/items/:itemId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    param('itemId').isUUID().withMessage('Valid item ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const result = await itemService.removeItem(req.params.itemId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Change item position in sequence (requires password)
router.post(
  '/:roomId/items/:itemId/position',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    param('itemId').isUUID().withMessage('Valid item ID is required'),
    body('position').isInt({ min: 1 }).withMessage('Position must be a positive integer'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const item = await itemService.changeItemPosition(
        req.params.itemId,
        parseInt(req.body.position)
      );
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

export default router;