import { useState, useEffect, useCallback } from 'react';
import { roomApi, itemApi, participantApi, bidApi } from '../lib/api';
import useRealtime from './useRealtime';
import { AuctionRoom, AuctionItem, Participant, Bid, WebSocketEvent, AuctionSummary } from '../lib/types';

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
  const [summary, setSummary] = useState<AuctionSummary | null>(null);
  const [showingSummary, setShowingSummary] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    // Don't try to fetch if roomId is not available
    if (!roomId) {
      setLoading(false);
      setError("Room ID is missing");
      return;
    }
    
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load auction data');
      console.error('Error fetching auction data:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Handle WebSocket events
  const handleRealtimeEvent = useCallback((data: WebSocketEvent, eventType: string) => {
    console.log(`Processing event ${eventType}:`, data);
    
    switch (eventType) {
      case 'room:start':
        // Update room active state
        setRoom(prev => {
          if (!prev) return null;
          return { ...prev, isActive: true };
        });
        
        // If data includes currentItem, update it as well
        if (data.currentItem) {
          setCurrentItem(data.currentItem);
          if (data.currentItem.timeoutSecs) {
            setTimeRemaining(data.currentItem.timeoutSecs);
          }
        } else if (data.currentItemId) {
          // Refresh data to get the latest state including current item
          fetchData();
        }
        break;
        
      case 'room:end':
        setRoom(prev => {
          if (!prev) return null;
          return { ...prev, isActive: false, endTime: new Date().toISOString() };
        });
        setCurrentItem(null);
        setTimeRemaining(null);
        
        // Make sure to update any items that were still active
        if (data.items) {
          setItems(data.items);
        } else {
          // Fetch latest data if full items list not provided
          fetchData();
        }
        
        // Fetch the auction summary
        try {
          roomApi.getAuctionSummary(roomId)
            .then(summaryData => {
              setSummary(summaryData);
              setShowingSummary(true);
            })
            .catch(err => {
              console.error('Error fetching auction summary:', err);
            });
        } catch (err) {
          console.error('Error initiating summary fetch:', err);
        }
        break;
        
      case 'participant:join':
        if (data.participant) {
          setParticipants(prev => [...prev, data.participant as Participant]);
        } else {
          console.error('Received participant:join event with missing participant data:', data);
        }
        break;
        
      case 'item:next':
        if (data.item) {
          setCurrentItem(data.item);
          setBids([]);
          // Reset timeout
          if (data.item.timeoutSecs) {
            setTimeRemaining(data.item.timeoutSecs);
          }
          
          // If the room data is included, update room as well
          if (data.room) {
            setRoom(data.room);
          } else {
            // Update room's currentItemId
            setRoom(prev => {
              if (!prev) return null;
              return { ...prev, currentItemId: data.item?.id || null };
            });
          }
          
          // Update in the items list if present
          if (data.item) {
            setItems(prev => 
              prev.map(item => 
                item.id === data.item?.id ? { ...item, isActive: true } : item
              )
            );
          }
        } else {
          console.error('Received item:next event with missing item data:', data);
          // Refresh all data to ensure consistency
          fetchData();
        }
        break;
        
      case 'item:bid':
        console.log('Received bid event:', data);
        // Make sure we have the bid data
        if (data && data.bid) {
          setBids(prev => [data.bid as Bid, ...prev]);
          
          // Update the current item price
          if (data.item) {
            // If the event includes the updated item, use it directly
            setCurrentItem(data.item);
            
            // Update item in the items array
            setItems(prev => 
              prev.map(item => 
                item.id === data.item?.id && data.item ? data.item : item
              )
            );
            
            // Reset timeout using the updated item
            if (data.item.timeoutSecs) {
              setTimeRemaining(data.item.timeoutSecs);
            }
          } else {
            // Fallback to updating just the current price
            setCurrentItem(prev => {
              if (!prev || !data.bid) return prev;
              return { ...prev, currentPrice: data.bid.amount };
            });
            
            // Update in items list too
            setItems(prev => 
              prev.map(item => 
                item.id === currentItem?.id && data.bid ? { ...item, currentPrice: data.bid.amount } : item
              )
            );
            
            // Reset timeout based on current item
            if (currentItem?.timeoutSecs) {
              setTimeRemaining(currentItem.timeoutSecs);
            }
          }
        } else {
          console.error('Invalid bid data received:', data);
        }
        break;
        
      case 'item:timeout:warning':
        if (data.secondsLeft !== undefined) {
          setTimeRemaining(data.secondsLeft);
        } else {
          console.error('Received item:timeout:warning without secondsLeft:', data);
        }
        break;
        
      case 'item:sold':
        // Update the sold item in the items list
        if (data.item && data.winner) {
          setItems(prev => 
            prev.map(item => 
              item.id === data.item?.id ? { 
                ...item, 
                isActive: false, 
                isSold: true, 
                winnerId: data.winner?.id || null,
                endedAt: data.item.endedAt || new Date().toISOString()
              } : item
            )
          );
          
          // If this is our current item, mark it as sold
          if (currentItem?.id === data.item.id) {
            setCurrentItem({ 
              ...data.item, 
              isActive: false, 
              isSold: true, 
              winnerId: data.winner.id,
              endedAt: data.item.endedAt || new Date().toISOString()
            });
            
            // Clear timeout when item is sold
            setTimeRemaining(0);
          }
          
          // Update room if provided
          if (data.room) {
            setRoom(data.room);
          }
        } else {
          console.error('Received item:sold event with missing data:', data);
          // Refresh to ensure state consistency
          fetchData();
        }
        break;
        
      case 'item:manually_ended':
        // Update the ended item in the items list
        if (data.item) {
          const hasWinner = !!data.winner;
          
          setItems(prev => 
            prev.map(item => 
              item.id === data.item?.id ? { 
                ...item, 
                isActive: false,
                endedManually: true,
                isSold: hasWinner,
                winnerId: data.winner?.id || null,
                endedAt: data.item.endedAt || new Date().toISOString() 
              } : item
            )
          );
          
          // If this is our current item, mark it as ended
          if (currentItem?.id === data.item.id) {
            setCurrentItem({ 
              ...data.item, 
              isActive: false,
              endedManually: true,
              isSold: hasWinner,
              winnerId: data.winner?.id || null,
              endedAt: data.item.endedAt || new Date().toISOString()
            });
            
            // Clear timeout when item is manually ended
            setTimeRemaining(0);
          }
          
          // Update room if provided
          if (data.room) {
            setRoom(data.room);
          }
        } else {
          console.error('Received item:manually_ended event with missing item data:', data);
          // Refresh to ensure state consistency
          fetchData();
        }
        break;
    }
  }, [currentItem?.id, currentItem?.timeoutSecs, fetchData, roomId]);

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to start auction');
      }
    },
    
    nextItem: async () => {
      try {
        await roomApi.nextItem(roomId);
        // The WebSocket will update the state
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to move to next item');
      }
    },
    
    endCurrentItem: async () => {
      try {
        await roomApi.endCurrentItem(roomId);
        // The WebSocket will update the state
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to end current item');
      }
    },
    
    endAuction: async () => {
      try {
        await roomApi.endAuction(roomId);
        // The WebSocket will update the state
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to end auction');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
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

  // Method to fetch summary on demand
  const fetchSummary = async () => {
    if (!roomId) return;
    
    try {
      setError(null);
      const summaryData = await roomApi.getAuctionSummary(roomId);
      setSummary(summaryData);
      setShowingSummary(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch auction summary');
      console.error('Error fetching auction summary:', err);
    }
  };
  
  // Toggle summary visibility
  const toggleSummary = () => {
    setShowingSummary(prev => !prev);
  };
  
  // Hide summary
  const hideSummary = () => {
    setShowingSummary(false);
  };

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
    summary,
    showingSummary,
    placeBid,
    refreshData: fetchData,
    fetchSummary,
    toggleSummary,
    hideSummary,
    ...(isHost ? hostActions : {}),
  };
}