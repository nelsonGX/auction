'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { roomApi } from '@/lib/api';
import RoomPasswordForm from '@/components/auth/RoomPasswordForm';
import ShareLink from '@/components/room/ShareLink';
import ItemForm from '@/components/room/ItemForm';
import ItemQueue from '@/components/room/ItemQueue';
import AuctionControls from '@/components/auction/AuctionControls';
import CurrentItem from '@/components/auction/CurrentItem';
import BidHistory from '@/components/auction/BidHistory';
import ParticipantsList from '@/components/auction/ParticipantsList';
import UpcomingItems from '@/components/auction/UpcomingItems';
import CompletedItems from '@/components/auction/CompletedItems';
import AuctionSummary from '@/components/auction/AuctionSummary';
import useAuction from '@/hooks/useAuction';

export default function HostDashboard() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const router = useRouter();
  
  // Check for authentication (using both session and localStorage)
  useEffect(() => {
    console.log('HostDashboard: Component mounted, roomId:', roomId);
    console.log('HostDashboard: Current isAuthenticated state:', isAuthenticated);
    
    // First, try to check session authentication
    async function checkSessionAuth() {
      try {
        // Try to check session-based auth first
        console.log('HostDashboard: Checking session-based auth');
        const authResponse = await roomApi.checkHostAuth(roomId);
        console.log('HostDashboard: Session auth response:', authResponse);
        
        if (authResponse.authenticated && authResponse.hostId) {
          console.log('HostDashboard: Setting authenticated state from session with id:', authResponse.hostId);
          setIsAuthenticated(true);
          setParticipantId(authResponse.hostId);
          
          // Update localStorage for backup
          const authState = {
            authenticated: true,
            id: authResponse.hostId,
          };
          localStorage.setItem(`host_auth_${roomId}`, JSON.stringify(authState));
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('HostDashboard: Error checking session auth:', error);
        return false;
      }
    }
    
  // Handle successful authentication
  const handleAuthentication = async (hostId: string) => {
    console.log('HostDashboard: handleAuthentication called with hostId:', hostId);
    
    try {
      // Store auth state in localStorage as backup
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
      
      // Check if session is working (after RoomPasswordForm has set it up)
      try {
        const sessionCheck = await roomApi.checkHostAuth(roomId);
        console.log('HostDashboard: Session check result:', sessionCheck);
        
        if (!sessionCheck.authenticated) {
          console.warn('HostDashboard: Session is not authenticated, but will continue with localStorage');
        }
      } catch (sessionErr) {
        console.error('HostDashboard: Error checking session:', sessionErr);
      }
      
      // Update React state
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

    // Fallback to localStorage if session auth fails
    async function checkLocalStorage() {
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
              console.log('HostDashboard: Found valid localStorage auth with id:', id);
              
              // First, attempt to establish a session using the credentials
              try {
                console.log('HostDashboard: Attempting to establish session from localStorage auth');
                
                // Get room details to check if we have the password stored or can access via API
                const room = await roomApi.getRoom(roomId);
                console.log('HostDashboard: Got room details:', room ? 'success' : 'failed');
                
                // Try to establish a session using our localStorage data
                try {
                  // This will try to establish a session using the hostId from localStorage
                  const sessionResult = await roomApi.reconnectSession(roomId, id);
                  console.log('HostDashboard: Session reconnection attempt result:', sessionResult);
                  
                  if (sessionResult.success) {
                    console.log('HostDashboard: Successfully established session');
                  }
                } catch (reconnectErr) {
                  console.warn('HostDashboard: Error in session reconnection attempt:', reconnectErr);
                  // Continue with localStorage auth even if this fails
                }
              } catch (sessionEstablishErr) {
                console.warn('HostDashboard: Failed to establish session, continuing with localStorage:', sessionEstablishErr);
              }
              
              // Set authenticated state regardless of session establishment success
              console.log('HostDashboard: Setting authenticated state from localStorage with id:', id);
              setIsAuthenticated(true);
              setParticipantId(id);
              return true;
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
            return true;
          }
        }
        
        return false;
      } catch (err) {
        console.error('HostDashboard: Error accessing localStorage:', err);
        return false;
      }
    }
    
    // Check auth in sequence: first session, then localStorage
    async function checkAuthentication() {
      const sessionAuth = await checkSessionAuth();
      if (!sessionAuth) {
        await checkLocalStorage();
      }
    }
    
    checkAuthentication();
  }, [roomId, isAuthenticated]);

  // Get auction state with host controls
  const auction = useAuction({
    roomId,
    participantId: participantId || undefined,
    isHost: true,
  });

  // Handle host actions
  const handleAction = (action: 'start' | 'next' | 'end-current' | 'end') => {
    console.log(`Host action triggered: ${action}`);
    
    // We'll update the UI optimistically here rather than wait for WebSocket events
    switch (action) {
      case 'start':
        // Optimistically update UI
        if (auction.room && !auction.room.isActive) {
          // const updatedRoom = { ...auction.room, isActive: true };
          
          // Get first item
          const firstItem = auction.items.find(item => item.position === 1);
          if (firstItem) {
            // Temporary UI update until WebSocket confirms
            auction.refreshData();
          }
        }
        break;
      case 'next':
        // Refresh data to show the changes
        auction.refreshData();
        break;
      case 'end-current':
        // Refresh data to show the changes
        auction.refreshData();
        break;
      case 'end':
        // Refresh data to show the changes
        auction.refreshData();
        break;
    }
  };

  // Handle item creation
  const handleItemAdded = () => {
    auction.refreshData();
  };

  if (!isAuthenticated) {
    const authCallback = (hostId: string) => {
      console.log('HostDashboard: Authentication callback wrapper called with hostId:', hostId);
      router.push(`/host/${roomId}`);
    };
    
    return (
    <>
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <RoomPasswordForm onAuthentication={authCallback} />
    </div>
    </>
    );
  }
  
  console.log('HostDashboard: User authenticated, showing dashboard')

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a.75.75 0 01-.75-.75V9a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v.25a4.5 4.5 0 004.5 4.5 4.5 4.5 0 004.5-4.5V9a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v.25A5.989 5.989 0 0114 10a5 5 0 00-4 4z" clipRule="evenodd" />
                </svg>
                Host Dashboard
              </h1>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-zinc-400 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Room ID: <code className="bg-zinc-800 px-2 py-0.5 rounded ml-1 text-zinc-300 font-mono">{roomId}</code>
                </span>
              </div>
            </div>
            
            {/* Room status badge */}
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium my-2 
              ${auction.room?.isActive 
                ? 'bg-green-900/30 text-green-400 border border-green-800' 
                : auction.room?.endTime 
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'}`}
            >
              {auction.room?.isActive 
                ? 'Auction Active' 
                : auction.room?.endTime 
                  ? 'Auction Ended' 
                  : 'Auction Not Started'}
            </div>
          </div>
        </div>

        {auction.loading ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-zinc-400 text-lg">Loading auction data...</p>
          </div>
        ) : (
          <>
            {auction.error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 animate-fade-in">
                <p className="text-red-300 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {auction.error}
                </p>
              </div>
            )}
            
            {/* Auction Summary Modal */}
            {auction.showingSummary && auction.summary && (
              <div className="fixed inset-0 bg-zinc-900/90 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-800 rounded-lg border border-zinc-700 shadow-2xl">
                  <div className="relative">
                    <button 
                      onClick={auction.hideSummary}
                      className="absolute right-3 top-3 bg-zinc-700 rounded-full p-2 z-10 text-zinc-300 hover:text-white hover:bg-zinc-600 transition-colors"
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <AuctionSummary summary={auction.summary} />
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Share Link */}
                <div className="animate-fade-in">
                  <ShareLink roomId={roomId} />
                </div>
                
                {/* Current Item with Countdown */}
                <div className="relative animate-slide-in">
                  <CurrentItem 
                    item={auction.currentItem} 
                    timeRemaining={auction.timeRemaining} 
                  />
                </div>
                
                {/* Bid History */}
                <div className="animate-slide-in" style={{ animationDelay: '50ms' }}>
                  <BidHistory bids={auction.bids} />
                </div>
                
                {/* Add Item Form and Queue (only if auction not started) */}
                {!auction.room?.isActive && (
                  <>
                    <div className="animate-slide-in" style={{ animationDelay: '100ms' }}>
                      <ItemForm 
                        roomId={roomId} 
                        onItemAdded={handleItemAdded} 
                      />
                    </div>
                    <div className="animate-slide-in" style={{ animationDelay: '150ms' }}>
                      <ItemQueue 
                        roomId={roomId}
                        items={auction.items}
                        onItemsReordered={auction.refreshData}
                      />
                    </div>
                  </>
                )}
                
                {/* Completed Items (show during active auction) */}
                {auction.room?.isActive && auction.completedItems.length > 0 && (
                  <div className="animate-slide-in" style={{ animationDelay: '150ms' }}>
                    <CompletedItems items={auction.completedItems} />
                  </div>
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Host Controls */}
                <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                  <AuctionControls 
                    roomId={roomId}
                    isActive={!!auction.room?.isActive}
                    hasCurrentItem={!!auction.currentItem}
                    hasNextItem={auction.upcomingItems.length > 0}
                    onAction={handleAction}
                  />
                </div>
                
                {/* Summary view button for ended auctions */}
                {auction.room?.endTime && (
                  <div className="bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <h3 className="text-lg font-semibold mb-4 text-zinc-100 border-b border-zinc-700 pb-2">Auction Results</h3>
                    <button
                      onClick={auction.summary ? auction.toggleSummary : auction.fetchSummary}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                      focus:ring-offset-zinc-800 font-medium transition-all duration-200
                      transform hover:translate-y-[-2px] active:translate-y-[1px]"
                    >
                      {auction.summary ? 'View Auction Summary' : 'Load Auction Results'}
                    </button>
                  </div>
                )}
                
                {/* Participants List */}
                <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <ParticipantsList 
                    participants={auction.participants} 
                    currentUserId={participantId || ''}
                  />
                </div>
                
                {/* Upcoming Items (show during active auction) */}
                {auction.room?.isActive && auction.upcomingItems.length > 0 && (
                  <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <UpcomingItems items={auction.upcomingItems} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}