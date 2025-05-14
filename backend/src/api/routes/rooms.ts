import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation';
import { roomExists, verifyRoomPassword, verifyHostSession, RoomRequest } from '../middleware/roomAuth';
import roomService from '../../services/room';
import authCache from '../../utils/authCache';

const router = Router();

// Create new auction room
router.post(
  '/',
  validate([
    body('name').notEmpty().withMessage('Room name is required'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('hostUsername').notEmpty().withMessage('Host username is required'),
  ]),
  async (req, res, next) => {
    try {
      const roomData = {
        name: req.body.name,
        password: req.body.password,
        hostUsername: req.body.hostUsername,
        startTime: new Date(),
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

// Authenticate with room password and set up session
router.post(
  '/:roomId/auth',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  roomExists,
  async (req: RoomRequest, res, next) => {
    try {
      // Authenticate room
      const result = await roomService.authenticateRoom(
        req.params.roomId,
        req.body.password
      );
      
      // Set up session
      if (!req.session.hostRooms) {
        req.session.hostRooms = {};
      }
      
      if (result.id) {
        // Save to session
        req.session.hostRooms[req.params.roomId] = result.id;
        req.session.isAuthenticated = true;
        await req.session.save();
        
        // Also save to memory cache
        authCache.setHostAuth(req.params.roomId, result.id);
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Update room settings (requires host authentication)
router.put(
  '/:roomId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req: RoomRequest, res, next) => {
    try {
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

// Delete room (requires host authentication)
router.delete(
  '/:roomId',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  roomExists,
  verifyHostSession,
  async (req, res, next) => {
    try {
      const result = await roomService.deleteRoom(req.params.roomId);
      
      // Clear session data for this room
      if (req.session.hostRooms && req.session.hostRooms[req.params.roomId]) {
        delete req.session.hostRooms[req.params.roomId];
        await req.session.save();
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Check if user is authenticated as host for a room
router.get(
  '/:roomId/host-auth',
  validate([
    param('roomId').isUUID().withMessage('Valid room ID is required'),
  ]),
  async (req: RoomRequest, res, next) => {
    try {
      // Check if user has an active session with host privileges for this room
      const isAuthenticated = !!(
        req.session.hostRooms && 
        req.session.hostRooms[req.params.roomId]
      );
      
      res.json({ 
        authenticated: isAuthenticated,
        hostId: isAuthenticated && req.session.hostRooms ? req.session.hostRooms[req.params.roomId] : null
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;