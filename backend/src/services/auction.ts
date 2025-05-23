import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

class AuctionService {
  // Start the auction
  async startAuction(roomId: string) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    if (room.isActive) {
      throw new BadRequestError('Auction has already started');
    }

    if (room.items.length === 0) {
      throw new BadRequestError('Cannot start auction with no items');
    }

    // Get the first item
    const firstItem = room.items[0];

    // Start the auction by activating the room and setting the first item as active
    const updatedRoom = await prisma.$transaction([
      // Activate the first item
      prisma.auctionItem.update({
        where: { id: firstItem.id },
        data: { isActive: true },
      }),
      
      // Update the room to be active and set the current item
      prisma.auctionRoom.update({
        where: { id: roomId },
        data: {
          isActive: true,
          currentItemId: firstItem.id,
        },
        include: {
          items: {
            orderBy: { position: 'asc' },
          },
          currentItem: true,
        },
      }),
    ]);

    return updatedRoom[1]; // Return the updated room
  }

  // Move to the next item in the auction
  async moveToNextItem(roomId: string) {
    // Check if room exists and is active
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
        currentItem: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    if (!room.isActive) {
      throw new BadRequestError('Auction has not started');
    }

    if (!room.currentItem) {
      throw new BadRequestError('No current item in auction');
    }

    // Find the index of the current item
    const currentIndex = room.items.findIndex(item => item.id === room.currentItemId);
    
    if (currentIndex === -1) {
      throw new BadRequestError('Current item not found in sequence');
    }

    // Check if current item is the last item or if there are no more active items
    if (currentIndex === room.items.length - 1) {
      // End the auction if this is the last item
      return this.endAuction(roomId);
    }
    
    // Check if there are any upcoming items that are not already ended or sold
    const upcomingItems = room.items.filter((item, idx) => 
      idx > currentIndex && !item.endedManually && !item.isSold && !item.endedAt
    );
    
    if (upcomingItems.length === 0) {
      // No more items to auction, end the auction
      return this.endAuction(roomId);
    }

    // Get the next item
    const nextItem = room.items[currentIndex + 1];

    // Mark current item as not active and possibly sold if it had bids
    const highestBid = await prisma.bid.findFirst({
      where: { itemId: room.currentItemId! },
      orderBy: { amount: 'desc' },
      include: { participant: true },
    });

    // Transaction to update everything
    const updatedRoom = await prisma.$transaction([
      // Mark current item as complete
      prisma.auctionItem.update({
        where: { id: room.currentItemId! },
        data: {
          isActive: false,
          isSold: !!highestBid,
          endedAt: new Date(),
          endedManually: true,
          winnerId: highestBid?.participantId,
        },
      }),

      // Activate the next item
      prisma.auctionItem.update({
        where: { id: nextItem.id },
        data: { isActive: true },
      }),

      // Update the room with the new current item
      prisma.auctionRoom.update({
        where: { id: roomId },
        data: { currentItemId: nextItem.id },
        include: {
          items: {
            orderBy: { position: 'asc' },
          },
          currentItem: true,
        },
      }),
    ]);
    
    // For safety, don't try to access potential non-existent property
    // Instead, if we have a currentItemId, just fetch the item directly
    if (updatedRoom[2].currentItemId) {
      const currentItem = await prisma.auctionItem.findUnique({
        where: { id: updatedRoom[2].currentItemId }
      });
      
      // For the return value - the room object with its properties only
      // We don't try to modify the TypeScript type by adding currentItem
      return updatedRoom[2];
    }

    return updatedRoom[2]; // Return the updated room
  }

  // End the current item auction manually
  async endCurrentItem(roomId: string) {
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
      throw new BadRequestError('Auction has not started');
    }

    if (!room.currentItem) {
      throw new BadRequestError('No current item in auction');
    }

    // Get the highest bid for the current item
    const highestBid = await prisma.bid.findFirst({
      where: { itemId: room.currentItemId! },
      orderBy: { amount: 'desc' },
      include: { participant: true },
    });

    // Update the current item
    const updatedItem = await prisma.auctionItem.update({
      where: { id: room.currentItemId! },
      data: {
        isActive: false,
        isSold: !!highestBid,
        endedAt: new Date(),
        endedManually: true,
        winnerId: highestBid?.participantId,
      },
      include: {
        winner: true,
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: { participant: true },
        },
      },
    });

    return updatedItem;
  }

  // End the entire auction
  async endAuction(roomId: string) {
    // Check if room exists
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: true,
        currentItem: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    if (!room.isActive) {
      throw new BadRequestError('Auction has not started');
    }

    // If there's a current item, end it
    if (room.currentItem) {
      // Get the highest bid for the current item
      const highestBid = await prisma.bid.findFirst({
        where: { itemId: room.currentItemId! },
        orderBy: { amount: 'desc' },
      });

      // Mark the current item as completed
      await prisma.auctionItem.update({
        where: { id: room.currentItemId! },
        data: {
          isActive: false,
          isSold: !!highestBid,
          endedAt: new Date(),
          endedManually: true,
          winnerId: highestBid?.participantId,
        },
      });
    }

    // End the auction
    const endedRoom = await prisma.auctionRoom.update({
      where: { id: roomId },
      data: {
        isActive: false,
        endTime: new Date(),
        currentItemId: null,
      },
      include: {
        items: {
          include: {
            winner: true,
            bids: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return endedRoom;
  }

  // Generate auction summary
  async getAuctionSummary(roomId: string) {
    // Find the room with its items and participants
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      include: {
        items: {
          include: {
            winner: true,
            bids: {
              orderBy: { timestamp: 'desc' },
              include: { participant: true },
            },
          },
          orderBy: { position: 'asc' },
        },
        participants: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Auction room not found');
    }

    // Calculate statistics
    const soldItems = room.items.filter(item => item.isSold);
    const unsoldItems = room.items.filter(item => !item.isSold && item.endedAt);
    const totalSales = soldItems.reduce((sum, item) => sum + item.currentPrice, 0);
    const averageSalePrice = soldItems.length > 0 
      ? totalSales / soldItems.length 
      : 0;

    // Participant stats
    const participantStats = room.participants.map(participant => {
      const wonItems = room.items.filter(item => item.winnerId === participant.id);
      const totalSpent = wonItems.reduce((sum, item) => sum + item.currentPrice, 0);
      const bidCount = room.items.reduce((count, item) => {
        return count + item.bids.filter(bid => bid.participant.id === participant.id).length;
      }, 0);

      return {
        participantId: participant.id,
        username: participant.username,
        isHost: participant.isHost,
        itemsWon: wonItems.length,
        totalSpent,
        bidCount,
        wonItems: wonItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.currentPrice,
        })),
      };
    });

    // Return summary
    return {
      roomId: room.id,
      roomName: room.name,
      hostUsername: room.hostUsername,
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.endTime 
        ? new Date(room.endTime).getTime() - new Date(room.startTime).getTime() 
        : null,
      totalItems: room.items.length,
      soldItems: soldItems.length,
      unsoldItems: unsoldItems.length,
      totalSales,
      averageSalePrice,
      highestSale: soldItems.length 
        ? Math.max(...soldItems.map(item => item.currentPrice)) 
        : 0,
      participants: room.participants.length,
      itemResults: room.items.map(item => ({
        id: item.id,
        name: item.name,
        startPrice: item.minPrice,
        finalPrice: item.currentPrice,
        isSold: item.isSold,
        winner: item.winner 
          ? { id: item.winner.id, username: item.winner.username } 
          : null,
        bidCount: item.bids.length,
      })),
      participantStats,
    };
  }
}

export default new AuctionService();