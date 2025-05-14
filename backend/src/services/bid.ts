import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface PlaceBidData {
  amount: number;
  participantId: string;
  roomId: string;
  itemId?: string;
}

class BidService {
  // Join a room as participant
  async joinRoom(roomId: string, username: string, isHost: boolean = false) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Check if username is already taken in this room
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        username_roomId: {
          username,
          roomId,
        },
      },
    });

    if (existingParticipant) {
      return existingParticipant; // Return existing participant
    }

    // Create new participant
    const participant = await prisma.participant.create({
      data: {
        username,
        isHost,
        roomId,
      },
    });

    return participant;
  }

  // Place a bid on the current item
  async placeBid(data: PlaceBidData) {
    const { amount, participantId, roomId, itemId } = data;

    // Check if room exists and is active
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        currentItem: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    if (!room.isActive) {
      throw new BadRequestError('Auction is not active');
    }

    // If itemId is provided, use it; otherwise use the room's current item
    let currentItem;
    if (itemId) {
      // Check if the provided itemId matches the room's current item
      if (room.currentItemId !== itemId) {
        throw new BadRequestError('The specified item is not the current active item');
      }
      currentItem = await prisma.auctionItem.findUnique({
        where: { id: itemId },
      });
    } else if (room.currentItem) {
      currentItem = room.currentItem;
    } else {
      throw new BadRequestError('No active item in the auction');
    }

    if (!currentItem) {
      throw new BadRequestError('Item not found or not active');
    }

    // Check if the item is active
    if (!currentItem.isActive) {
      throw new BadRequestError('Item is not currently active for bidding');
    }

    // Check if the item has already been sold
    if (currentItem.isSold || currentItem.endedManually) {
      throw new BadRequestError('This item auction has already ended');
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    // Check if the bid amount is higher than the current price
    if (amount <= currentItem.currentPrice) {
      throw new BadRequestError('Bid amount must be higher than current price');
    }

    // Check if bid is at least the minimum price
    if (amount < currentItem.minPrice) {
      throw new BadRequestError('Bid amount must be at least the minimum price');
    }

    // Create the bid in a transaction
    const [bid, updatedItem] = await prisma.$transaction([
      // Create the bid
      prisma.bid.create({
        data: {
          amount,
          participantId,
          itemId: currentItem.id,
          roomId,
        },
        include: {
          participant: true,
        },
      }),

      // Update the item's current price
      prisma.auctionItem.update({
        where: { id: currentItem.id },
        data: {
          currentPrice: amount,
        },
      }),
    ]);

    return {
      bid,
      updatedItem,
    };
  }

  // Get all bids for an item
  async getBidsByItemId(itemId: string) {
    // Check if item exists
    const item = await prisma.auctionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Get bids in reverse chronological order
    const bids = await prisma.bid.findMany({
      where: { itemId },
      orderBy: { timestamp: 'desc' },
      include: {
        participant: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return bids;
  }

  // Get all participants in a room
  async getParticipantsByRoomId(roomId: string) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Get all participants
    const participants = await prisma.participant.findMany({
      where: { roomId },
      select: {
        id: true,
        username: true,
        isHost: true,
        bids: {
          select: {
            id: true,
          },
        },
        wonItems: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return participants;
  }
}

export default new BidService();