import { useState, useEffect, useCallback } from 'react';
import { roomApi, itemApi, participantApi, bidApi } from '../lib/api';
import useRealtime from './useRealtime';
import { AuctionRoom, AuctionItem, Participant, Bid, WebSocketEvent } from '../lib/types';

interface UseAuctionOptions {
  roomId: string;
  participantId?: string;
  isHost?: boolean;
}

export default function useAuction({ roomId, participantId, isHost = false }: UseAuctionOptions) {
  // State
  const [room, setRoom] = useState<AuctionRoom | null>(null);
  const [currentItem, setCurrentItem] = useState<AuctionItem | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch room data
      const roomData = await roomApi.getRoom(roomId);
      setRoom(roomData);
      
      // Fetch items
      const itemsData = await itemApi.getItems(roomId);
      setItems(itemsData);
      
      // Set current item if available
      if (roomData.currentItemId) {
        const currentItemData = itemsData.find(item => item.id === roomData.currentItemId) || null;
        setCurrentItem(currentItemData);
        
        // Fetch bids for current item
        if (currentItemData) {
          const bidsData = await bidApi.getBids(roomId, currentItemData.id);
          setBids(bidsData);
        }
      }
      
      // Fetch participants
      const participantsData = await participantApi.getParticipants(roomId);
      setParticipants(participantsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load auction data');
      console.error('Error fetching auction data:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Handle WebSocket events
  const handleRealtimeEvent = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case 'room:start':
        setRoom(prev => prev ? { ...prev, isActive: true } : null);
        break;
        
      case 'room:end':
        setRoom(prev => prev ? { ...prev, isActive: false, endTime: new Date().toISOString() } : null);
        setCurrentItem(null);
        setTimeRemaining(null);
        break;
        
      case 'participant:join':
        setParticipants(prev => [...prev, event.participant]);
        break;
        
      case 'item:next':
        setCurrentItem(event.item);
        setBids([]);
        // Reset timeout
        if (event.item.timeoutSecs) {
          setTimeRemaining(event.item.timeoutSecs);
        }
        break;
        
      case 'item:bid':
        setBids(prev => [event.bid, ...prev]);
        setCurrentItem(prev => prev ? { ...prev, currentPrice: event.bid.amount } : null);
        // Reset timeout if we have current item
        if (currentItem?.timeoutSecs) {
          setTimeRemaining(currentItem.timeoutSecs);
        }
        break;
        
      case 'item:timeout:warning':
        setTimeRemaining(event.secondsLeft);
        break;
        
      case 'item:sold':
        // Update the sold item in the items list
        setItems(prev => 
          prev.map(item => 
            item.id === event.item.id ? { ...item, isSold: true, winnerId: event.winner.id } : item
          )
        );
        // If this is our current item, mark it as sold
        if (currentItem?.id === event.item.id) {
          setCurrentItem({ ...event.item, isSold: true, winnerId: event.winner.id });
        }
        break;
        
      case 'item:manually_ended':
        // Update the ended item in the items list
        setItems(prev => 
          prev.map(item => 
            item.id === event.item.id ? { 
              ...item, 
              endedManually: true,
              isSold: !!event.winner,
              winnerId: event.winner?.id || null
            } : item
          )
        );
        // If this is our current item, mark it as ended
        if (currentItem?.id === event.item.id) {
          setCurrentItem({ 
            ...event.item, 
            endedManually: true,
            isSold: !!event.winner,
            winnerId: event.winner?.id || null
          });
        }
        break;
    }
  }, [currentItem]);

  // Initialize real-time connection
  const { isConnected } = useRealtime({
    roomId,
    participantId,
    onEvent: handleRealtimeEvent,
    onConnected: () => {
      console.log('Connected to auction real-time updates');
    },
  });

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer for current item
  useEffect(() => {
    if (!currentItem?.isActive || timeRemaining === null) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentItem?.isActive, timeRemaining]);

  // Host actions
  const hostActions = {
    startAuction: async () => {
      try {
        await roomApi.startAuction(roomId);
        // The WebSocket will update the state
      } catch (err: any) {
        setError(err.message || 'Failed to start auction');
      }
    },
    
    nextItem: async () => {
      try {
        await roomApi.nextItem(roomId);
        // The WebSocket will update the state
      } catch (err: any) {
        setError(err.message || 'Failed to move to next item');
      }
    },
    
    endCurrentItem: async () => {
      try {
        await roomApi.endCurrentItem(roomId);
        // The WebSocket will update the state
      } catch (err: any) {
        setError(err.message || 'Failed to end current item');
      }
    },
    
    endAuction: async () => {
      try {
        await roomApi.endAuction(roomId);
        // The WebSocket will update the state
      } catch (err: any) {
        setError(err.message || 'Failed to end auction');
      }
    },
  };

  // Place bid
  const placeBid = async (amount: number) => {
    if (!participantId || !currentItem?.id) {
      setError('Cannot place bid at this time');
      return;
    }

    try {
      await bidApi.placeBid(roomId, participantId, currentItem.id, amount);
      // The WebSocket will update the bids and current price
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    }
  };

  // Computed properties
  const upcomingItems = items
    .filter(item => !item.isSold && !item.isActive)
    .sort((a, b) => a.position - b.position);
    
  const completedItems = items
    .filter(item => item.isSold || item.endedManually)
    .sort((a, b) => {
      if (a.endedAt && b.endedAt) {
        return new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime();
      }
      return 0;
    });

  // Return the auction state and actions
  return {
    room,
    currentItem,
    participants,
    bids,
    items,
    upcomingItems,
    completedItems,
    timeRemaining,
    loading,
    error,
    isConnected,
    placeBid,
    refreshData: fetchData,
    ...(isHost ? hostActions : {}),
  };
}