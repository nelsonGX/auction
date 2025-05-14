'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '../../../lib/api';
import RoomPasswordForm from '../../../components/auth/RoomPasswordForm';
import ShareLink from '../../../components/room/ShareLink';
import ItemForm from '../../../components/room/ItemForm';
import ItemQueue from '../../../components/room/ItemQueue';
import AuctionControls from '../../../components/auction/AuctionControls';
import CurrentItem from '../../../components/auction/CurrentItem';
import BidHistory from '../../../components/auction/BidHistory';
import ParticipantsList from '../../../components/auction/ParticipantsList';
import UpcomingItems from '../../../components/auction/UpcomingItems';
import CompletedItems from '../../../components/auction/CompletedItems';
import Countdown from '../../../components/auction/Countdown';
import useAuction from '../../../hooks/useAuction';

export default function HostDashboard({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  
  // Check for stored auth state on component mount
  useEffect(() => {
    const storedAuthState = localStorage.getItem(`host_auth_${roomId}`);
    if (storedAuthState) {
      try {
        const { authenticated, id } = JSON.parse(storedAuthState);
        if (authenticated) {
          setIsAuthenticated(true);
          setParticipantId(id);
        }
      } catch (err) {
        localStorage.removeItem(`host_auth_${roomId}`);
      }
    }
  }, [roomId]);

  // Handle successful authentication
  const handleAuthentication = (hostId: string) => {
    setIsAuthenticated(true);
    setParticipantId(hostId);
    
    // Store auth state in localStorage
    localStorage.setItem(`host_auth_${roomId}`, JSON.stringify({
      authenticated: true,
      id: hostId,
    }));
  };

  // Get auction state with host controls
  const auction = useAuction({
    roomId,
    participantId: participantId || undefined,
    isHost: true,
  });

  // Handle host actions
  const handleAction = (action: 'start' | 'next' | 'end-current' | 'end') => {
    switch (action) {
      case 'start':
        auction.startAuction?.();
        break;
      case 'next':
        auction.nextItem?.();
        break;
      case 'end-current':
        auction.endCurrentItem?.();
        break;
      case 'end':
        auction.endAuction?.();
        break;
    }
  };

  // Handle item creation
  const handleItemAdded = () => {
    auction.refreshData();
  };

  if (!isAuthenticated) {
    return <RoomPasswordForm roomId={roomId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Host Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Room ID: {roomId}
          </p>
        </div>

        {auction.loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading auction data...</p>
          </div>
        ) : (
          <>
            {auction.error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-red-700">{auction.error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Share Link */}
                <ShareLink roomId={roomId} />
                
                {/* Current Item with Countdown */}
                <div className="relative">
                  <CurrentItem 
                    item={auction.currentItem} 
                    timeRemaining={auction.timeRemaining} 
                  />
                  {auction.currentItem && auction.timeRemaining !== null && (
                    <div className="absolute top-4 right-4">
                      <Countdown 
                        seconds={auction.timeRemaining} 
                      />
                    </div>
                  )}
                </div>
                
                {/* Bid History */}
                <BidHistory bids={auction.bids} />
                
                {/* Add Item Form and Queue (only if auction not started) */}
                {!auction.room?.isActive && (
                  <>
                    <ItemForm 
                      roomId={roomId} 
                      onItemAdded={handleItemAdded} 
                    />
                    <ItemQueue 
                      roomId={roomId}
                      items={auction.items}
                      onItemsReordered={auction.refreshData}
                    />
                  </>
                )}
                
                {/* Completed Items (show during active auction) */}
                {auction.room?.isActive && auction.completedItems.length > 0 && (
                  <CompletedItems items={auction.completedItems} />
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Host Controls */}
                <AuctionControls 
                  roomId={roomId}
                  isActive={!!auction.room?.isActive}
                  hasCurrentItem={!!auction.currentItem}
                  hasNextItem={auction.upcomingItems.length > 0}
                  onAction={handleAction}
                />
                
                {/* Participants List */}
                <ParticipantsList 
                  participants={auction.participants} 
                  currentUserId={participantId || ''}
                />
                
                {/* Upcoming Items (show during active auction) */}
                {auction.room?.isActive && auction.upcomingItems.length > 0 && (
                  <UpcomingItems items={auction.upcomingItems} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}