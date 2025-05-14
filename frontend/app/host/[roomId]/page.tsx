'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function HostDashboard() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId;
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  
  // Check for stored auth state on component mount
  useEffect(() => {
    console.log('HostDashboard: Component mounted, roomId:', roomId);
    console.log('HostDashboard: Current isAuthenticated state:', isAuthenticated);
    
    // Debug localStorage directly
    try {
      console.log('HostDashboard: Checking localStorage for auth state');
      const key = `host_auth_${roomId}`;
      console.log('HostDashboard: Looking for localStorage key:', key);
      
      const storedAuthState = localStorage.getItem(key);
      console.log('HostDashboard: Stored auth state:', storedAuthState);
      
      if (storedAuthState) {
        try {
          const parsedState = JSON.parse(storedAuthState);
          console.log('HostDashboard: Parsed auth state:', parsedState);
          
          const { authenticated, id } = parsedState;
          if (authenticated && id) {
            console.log('HostDashboard: Setting authenticated state from localStorage with id:', id);
            setIsAuthenticated(true);
            setParticipantId(id);
          } else {
            console.log('HostDashboard: Invalid auth state - missing authenticated or id');
          }
        } catch (err) {
          console.error('HostDashboard: Error parsing stored auth state:', err);
          localStorage.removeItem(key);
        }
      } else {
        console.log('HostDashboard: No stored auth state found');
        
        // For debugging: force auth if URL has a debug param
        const url = new URL(window.location.href);
        if (url.searchParams.has('debug')) {
          console.log('HostDashboard: Debug mode activated, forcing authentication');
          const debugHostId = `debug-host-${Date.now()}`;
          handleAuthentication(debugHostId);
        }
      }
    } catch (err) {
      console.error('HostDashboard: Error accessing localStorage:', err);
    }
  }, [roomId]);

  // Handle successful authentication
  const handleAuthentication = (hostId: string) => {
    console.log('HostDashboard: handleAuthentication called with hostId:', hostId);
    
    try {
      // Store auth state in localStorage first
      const authState = {
        authenticated: true,
        id: hostId,
      };
      console.log('HostDashboard: Setting localStorage with auth state:', authState);
      
      // Force synchronous localStorage write and verify
      localStorage.setItem(`host_auth_${roomId}`, JSON.stringify(authState));
      const verification = localStorage.getItem(`host_auth_${roomId}`);
      console.log('HostDashboard: localStorage verification:', verification);
      
      if (!verification) {
        console.error('HostDashboard: localStorage verification failed!');
      }
      
      // Then update React state
      setIsAuthenticated(true);
      setParticipantId(hostId);
      
      console.log('HostDashboard: Authentication complete, state updated');
    } catch (error) {
      console.error('HostDashboard: Error in handleAuthentication:', error);
      
      // Try to update state anyway
      setIsAuthenticated(true);
      setParticipantId(hostId);
    }
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
    console.log('HostDashboard: Not authenticated, showing RoomPasswordForm');
    console.log('HostDashboard: handleAuthentication function exists:', !!handleAuthentication);
    
    // Create a wrapper function to ensure it's correctly passed
    const authCallback = (hostId: string) => {
      console.log('HostDashboard: Authentication callback wrapper called with hostId:', hostId);
      handleAuthentication(hostId);
    };
    
    return <RoomPasswordForm onAuthentication={authCallback} />;
  }
  
  console.log('HostDashboard: User authenticated, showing dashboard')

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