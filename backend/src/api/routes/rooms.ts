import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyRoomPassword, RoomRequest } from '../middleware/roomAuth';
import roomService from '../../services/room';

const router = Router();

// Create new auction room
router.post(
  '/',
  validate([
    body('name').notEmpty().withMessage('Room name is required'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('hostUsername').notEmpty().withMessage('Host username is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
  ]),
  async (req, res, next) => {
    try {
      const roomData = {
        name: req.body.name,
        password: req.body.password,
        hostUsername: req.body.hostUsername,
        startTime: new Date(req.body.startTime),
      };

      const room = await roomService.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Get room details (public info)
router.get(
  '/:roomId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  async (req, res, next) => {
    try {
      const room = await roomService.getRoomById(req.params.roomId);
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Authenticate with room password
router.post(
  '/:roomId/auth',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req, res, next) => {
    try {
      const result = await roomService.authenticateRoom(
        req.params.roomId,
        req.body.password
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Update room settings (requires password)
router.put(
  '/:roomId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req: RoomRequest, res, next) => {
    try {
      // Extract only allowed fields
      const updateData = {
        name: req.body.name,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        isActive: req.body.isActive,
        password: req.body.newPassword, // If changing password
      };

      const room = await roomService.updateRoom(
        req.params.roomId,
        updateData
      );
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

// Delete room (requires password)
router.delete(
  '/:roomId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyRoomPassword,
  async (req, res, next) => {
    try {
      const result = await roomService.deleteRoom(req.params.roomId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;