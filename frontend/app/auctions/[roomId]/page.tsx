'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ParticipantForm from '../../../components/auth/ParticipantForm';
import CurrentItem from '../../../components/auction/CurrentItem';
import BidControls from '../../../components/auction/BidControls';
import BidHistory from '../../../components/auction/BidHistory';
import ParticipantsList from '../../../components/auction/ParticipantsList';
import UpcomingItems from '../../../components/auction/UpcomingItems';
import CompletedItems from '../../../components/auction/CompletedItems';
import AuctionSummary from '../../../components/auction/AuctionSummary';
import Countdown from '../../../components/auction/Countdown';
import useAuction from '../../../hooks/useAuction';
import { bidApi, participantApi } from '../../../lib/api';

export default function AuctionRoom() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const [isJoined, setIsJoined] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  // Check for stored participant state on component mount
  useEffect(() => {
    const storedParticipant = localStorage.getItem(`participant_${roomId}`);
    if (storedParticipant) {
      try {
        const { id, name } = JSON.parse(storedParticipant);
        setParticipantId(id);
        setUsername(name);
        setIsJoined(true);
      } catch (err) {
        localStorage.removeItem(`participant_${roomId}`);
      }
    }
  }, [roomId]);

  // Get auction state
  const auction = useAuction({
    roomId,
    participantId: participantId || undefined,
  });

  // Handle joining the auction
  const handleJoin = (id: string, name: string) => {
    console.log(`Joining auction with participantId: ${id}, username: ${name}`);
    
    // Validate the participantId
    if (!id) {
      console.error("Error: Received empty participantId");
      alert("Error: Could not join auction (empty participant ID)");
      return;
    }
    
    setParticipantId(id);
    setUsername(name);
    setIsJoined(true);
    
    // Store participant info in localStorage with better formatting
    const participantData = JSON.stringify({
      id,
      name,
    });
    
    try {
      localStorage.setItem(`participant_${roomId}`, participantData);
      console.log(`Stored in localStorage: ${participantData}`);
      
      // Verify storage
      const verifyData = localStorage.getItem(`participant_${roomId}`);
      console.log(`Verification from localStorage: ${verifyData}`);
    } catch (err) {
      console.error('Error storing participant data:', err);
    }
  };

  // Handle bid placed
  const handleBidPlaced = () => {
    // The state will be updated via websocket, but we can also refresh data to be safe
    auction.refreshData();
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-zinc-900 to-zinc-800">
        <div className="w-full max-w-md">
          <ParticipantForm roomId={roomId} onJoin={handleJoin} />
          
          {/* Debug info for joining - collapsed in a disclosure for cleaner UI */}
          <div className="mt-6 p-4 bg-zinc-900/70 rounded-lg text-xs border border-zinc-700 animate-fade-in">
            <details className="text-zinc-400">
              <summary className="font-bold cursor-pointer hover:text-zinc-300 transition-colors">Debug Info</summary>
              <div className="mt-3 space-y-3 pl-4 border-l border-zinc-700">
                <div className="mb-2">
                  <strong className="text-zinc-300">Room ID:</strong> <span className="font-mono">{roomId}</span>
                </div>
                <div className="mb-2">
                  <strong className="text-zinc-300">LocalStorage:</strong> <span className="font-mono">{typeof window !== 'undefined' && localStorage.getItem(`participant_${roomId}`) || 'No data'}</span>
                </div>
                
                {/* Debug button to clear stored participant */}
                <button
                  onClick={() => {
                    localStorage.removeItem(`participant_${roomId}`);
                    window.location.reload();
                  }}
                  className="mt-2 bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
                >
                  Clear Stored Participant
                </button>
                
                {/* Debug form to force join */}
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <h5 className="font-bold mb-2">Force Join (Debug)</h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Username"
                      className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 rounded"
                      id="debugUsername"
                    />
                    <button
                      onClick={async () => {
                        const debugUsername = (document.getElementById('debugUsername') as HTMLInputElement).value;
                        if (debugUsername) {
                          try {
                            const data = await participantApi.join(roomId, debugUsername);
                            handleJoin(data.participantId, debugUsername);
                            
                            // Double check localStorage was set
                            console.log('Participant joined:', data);
                            console.log('LocalStorage after join:', localStorage.getItem(`participant_${roomId}`));
                          } catch (err) {
                            console.error('Debug join error:', err);
                            alert('Error joining: ' + (err as Error).message);
                          }
                        }
                      }}
                      className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Force Join
                    </button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // Determine if bidding is allowed - less strict check to fix bidding
  const canBid = 
    auction.room?.isActive && 
    auction.currentItem && 
    !auction.currentItem.isSold && 
    !auction.currentItem.endedManually;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">
                {auction.room?.name || 'Auction Room'}
              </h1>
              <p className="mt-1 text-sm text-zinc-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Logged in as: <span className="font-medium text-zinc-300 ml-1">{username}</span>
              </p>
            </div>
            
            {/* Room status badge */}
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium 
              ${auction.room?.isActive 
                ? 'bg-green-900/30 text-green-400 border border-green-800' 
                : auction.room?.endTime 
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'}`}
            >
              {auction.room?.isActive 
                ? 'Active' 
                : auction.room?.endTime 
                  ? 'Ended' 
                  : 'Not Started'}
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
            
            {!auction.isConnected && (
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6 animate-fade-in">
                <p className="text-yellow-300 flex items-center">
                  <svg className="h-5 w-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connecting to real-time updates...
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
                {/* Current Item with Countdown */}
                <div className="relative animate-slide-in">
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
                
                {/* Bid Controls */}
                {participantId && auction.currentItem && (
                  <div className="animate-slide-in" style={{ animationDelay: '50ms' }}>
                    <BidControls 
                      roomId={roomId}
                      itemId={auction.currentItem.id}
                      participantId={participantId}
                      currentPrice={auction.currentItem.currentPrice}
                      minPrice={auction.currentItem.minPrice}
                      disabled={!canBid}
                      onBidPlaced={handleBidPlaced}
                    />
                  </div>
                )}
                
                {/* Bid History */}
                <div className="animate-slide-in" style={{ animationDelay: '100ms' }}>
                  <BidHistory bids={auction.bids} />
                </div>
                
                {/* Completed Items */}
                {auction.completedItems.length > 0 && (
                  <div className="animate-slide-in" style={{ animationDelay: '150ms' }}>
                    <CompletedItems items={auction.completedItems} />
                  </div>
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Room Status */}
                <div className="bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4 text-zinc-100 border-b border-zinc-700 pb-2">Room Status</h3>
                  <div className="space-y-3">
                    <p className="flex justify-between items-center">
                      <span className="text-zinc-400">Status:</span>
                      <span className={`font-medium px-2 py-0.5 rounded ${
                        auction.room?.isActive 
                          ? 'bg-green-900/30 text-green-400' 
                          : auction.room?.endTime 
                            ? 'bg-blue-900/30 text-blue-400' 
                            : 'bg-yellow-900/30 text-yellow-400'}`}
                      >
                        {auction.room?.isActive 
                          ? 'Active' 
                          : auction.room?.endTime 
                            ? 'Ended' 
                            : 'Not Started'}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-zinc-400">Host:</span>
                      <span className="font-medium text-zinc-200">
                        {auction.participants.find(p => p.isHost)?.username || 'Unknown'}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-zinc-400">Items:</span>
                      <span className="font-medium text-zinc-200">
                        {auction.items.length}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-zinc-400">Completed:</span>
                      <span className="font-medium text-zinc-200">
                        {auction.completedItems.length}
                      </span>
                    </p>
                  </div>
                  
                  {/* Summary view button for ended auctions */}
                  {auction.room?.endTime && (
                    <button
                      onClick={auction.summary ? auction.toggleSummary : auction.fetchSummary}
                      className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                      focus:ring-offset-zinc-800 font-medium transition-all duration-200
                      transform hover:translate-y-[-2px] active:translate-y-[1px]"
                    >
                      {auction.summary ? 'View Auction Summary' : 'Load Auction Results'}
                    </button>
                  )}
                </div>
                
                {/* Participants List */}
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <ParticipantsList 
                    participants={auction.participants} 
                    currentUserId={participantId || ''}
                  />
                </div>
                
                {/* Upcoming Items */}
                {auction.upcomingItems.length > 0 && (
                  <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
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