import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface PlaceBidData {
  amount: number;
  participantId: string;
  roomId: string;
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
    const { amount, participantId, roomId } = data;

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

    if (!room.currentItem) {
      throw new BadRequestError('No active item in the auction');
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    // Get current item
    const currentItem = room.currentItem;

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