import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface CreateItemData {
  name: string;
  description?: string;
  imageUrl?: string;
  minPrice: number;
  timeoutSecs: number;
  position?: number;
  roomId: string;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  imageUrl?: string;
  minPrice?: number;
  timeoutSecs?: number;
}

class ItemService {
  // Add item to room
  async addItem(data: CreateItemData) {
    const { roomId } = data;

    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // If auction is already active, don't allow adding new items
    if (room.isActive) {
      throw new BadRequestError('Cannot add items after auction has started');
    }

    // Determine position (if not provided, add to the end)
    const position = data.position || (room.items.length > 0 
      ? Math.max(...room.items.map(item => item.position)) + 1 
      : 1);

    // Create item
    const item = await prisma.auctionItem.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        minPrice: data.minPrice,
        timeoutSecs: data.timeoutSecs,
        position,
        roomId,
        currentPrice: data.minPrice, // Set current price to min price initially
      },
    });

    return item;
  }

  // Get all items in a room
  async getItemsByRoomId(roomId: string) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Get items ordered by position
    const items = await prisma.auctionItem.findMany({
      where: { roomId },
      orderBy: { position: 'asc' },
      include: {
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Get only the most recent bids
          include: {
            participant: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return items;
  }

  // Get a specific item
  async getItemById(itemId: string) {
    const item = await prisma.auctionItem.findUnique({
      where: { id: itemId },
      include: {
        bids: {
          orderBy: { timestamp: 'desc' },
          include: {
            participant: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    return item;
  }

  // Update an item
  async updateItem(itemId: string, data: UpdateItemData) {
    // Check if item exists
    const item = await prisma.auctionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Check if room is active
    const room = await prisma.auctionRoom.findUnique({
      where: { id: item.roomId },
    });

    if (room?.isActive) {
      throw new BadRequestError('Cannot update items after auction has started');
    }

    // Update the item
    const updatedItem = await prisma.auctionItem.update({
      where: { id: itemId },
      data,
    });

    return updatedItem;
  }

  // Remove an item
  async removeItem(itemId: string) {
    // Check if item exists
    const item = await prisma.auctionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Check if room is active
    const room = await prisma.auctionRoom.findUnique({
      where: { id: item.roomId },
    });

    if (room?.isActive) {
      throw new BadRequestError('Cannot remove items after auction has started');
    }

    // Delete the item
    await prisma.auctionItem.delete({
      where: { id: itemId },
    });

    // Reposition remaining items in the room
    const remainingItems = await prisma.auctionItem.findMany({
      where: { roomId: item.roomId },
      orderBy: { position: 'asc' },
    });

    // Update positions
    for (let i = 0; i < remainingItems.length; i++) {
      await prisma.auctionItem.update({
        where: { id: remainingItems[i].id },
        data: { position: i + 1 },
      });
    }

    return { message: 'Item removed successfully' };
  }

  // Change item position in sequence
  async changeItemPosition(itemId: string, newPosition: number) {
    // Check if item exists
    const item = await prisma.auctionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Check if room is active
    const room = await prisma.auctionRoom.findUnique({
      where: { id: item.roomId },
    });

    if (room?.isActive) {
      throw new BadRequestError('Cannot reposition items after auction has started');
    }

    // Get all items in the room
    const items = await prisma.auctionItem.findMany({
      where: { roomId: item.roomId },
      orderBy: { position: 'asc' },
    });

    // Validate new position
    if (newPosition < 1 || newPosition > items.length) {
      throw new BadRequestError('Invalid position');
    }

    // No change needed if position is the same
    if (newPosition === item.position) {
      return item;
    }

    // Begin a transaction to reposition items
    return await prisma.$transaction(async (tx) => {
      // Temporary position to avoid constraints
      await tx.auctionItem.update({
        where: { id: itemId },
        data: { position: -1 },
      });

      // Shift other items
      if (newPosition < item.position) {
        // Moving up - shift items in between down
        for (const otherItem of items) {
          if (otherItem.id !== itemId && 
              otherItem.position >= newPosition && 
              otherItem.position < item.position) {
            await tx.auctionItem.update({
              where: { id: otherItem.id },
              data: { position: otherItem.position + 1 },
            });
          }
        }
      } else {
        // Moving down - shift items in between up
        for (const otherItem of items) {
          if (otherItem.id !== itemId && 
              otherItem.position <= newPosition && 
              otherItem.position > item.position) {
            await tx.auctionItem.update({
              where: { id: otherItem.id },
              data: { position: otherItem.position - 1 },
            });
          }
        }
      }

      // Set the item to the new position
      return await tx.auctionItem.update({
        where: { id: itemId },
        data: { position: newPosition },
      });
    });
  }
}

export default new ItemService();