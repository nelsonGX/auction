import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface CreateRoomData {
  name: string;
  password: string;
  hostUsername: string;
  startTime: Date;
}

export interface UpdateRoomData {
  name?: string;
  password?: string;
  startTime?: Date;
  endTime?: Date;
  isActive?: boolean;
}

class RoomService {
  // Create a new auction room
  async createRoom(data: CreateRoomData) {
    const { name, password, hostUsername, startTime } = data;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the room
    const room = await prisma.auctionRoom.create({
      data: {
        name,
        password: hashedPassword,
        hostUsername,
        startTime,
        participants: {
          create: {
            username: hostUsername,
            isHost: true,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Return room without sensitive data
    const { password: _, ...roomWithoutPassword } = room;
    return roomWithoutPassword;
  }

  // Get room by ID (public info)
  async getRoomById(roomId: string) {
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        participants: {
          select: {
            id: true,
            username: true,
            isHost: true,
          },
        },
        currentItem: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Return room without password
    const { password: _, ...roomWithoutPassword } = room;
    return roomWithoutPassword;
  }

  // Update room settings
  async updateRoom(roomId: string, data: UpdateRoomData) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Handle password update if provided
    let updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update the room
    const updatedRoom = await prisma.auctionRoom.update({
      where: { id: roomId },
      data: updateData,
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        participants: {
          select: {
            id: true,
            username: true,
            isHost: true,
          },
        },
      },
    });

    // Return room without password
    const { password: _, ...roomWithoutPassword } = updatedRoom;
    return roomWithoutPassword;
  }

  // Delete room
  async deleteRoom(roomId: string) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Delete room and related data
    // Prisma will handle cascading deletes based on schema relationships
    await prisma.auctionRoom.delete({
      where: { id: roomId },
    });

    return { message: 'Auction room deleted successfully' };
  }

  // Authenticate with room password
  async authenticateRoom(roomId: string, password: string) {
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, room.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Invalid password');
    }

    // Return room without password
    const { password: _, ...roomWithoutPassword } = room;
    return {
      authenticated: true,
      room: roomWithoutPassword,
    };
  }
}

export default new RoomService();