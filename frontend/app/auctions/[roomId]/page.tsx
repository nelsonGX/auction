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
      <div className="w-full max-w-md mx-auto">
        <ParticipantForm roomId={roomId} onJoin={handleJoin} />
        
        {/* Debug info for joining */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">Debug Info</h4>
          <div className="mb-2">
            <strong>Room ID:</strong> {roomId}
          </div>
          <div className="mb-2">
            <strong>LocalStorage:</strong> {typeof window !== 'undefined' && localStorage.getItem(`participant_${roomId}`) || 'No data'}
          </div>
          
          {/* Debug button to clear stored participant */}
          <button
            onClick={() => {
              localStorage.removeItem(`participant_${roomId}`);
              window.location.reload();
            }}
            className="mt-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
          >
            Clear Stored Participant
          </button>
          
          {/* Debug form to force join */}
          <div className="mt-4">
            <h5 className="font-bold mb-1">Force Join (Debug)</h5>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                className="flex-1 px-2 py-1 border border-gray-300 rounded"
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
                className="bg-yellow-600 text-white px-2 py-1 rounded"
              >
                Force Join
              </button>
            </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {auction.room?.name || 'Auction Room'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Logged in as: {username}
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
            
            {!auction.isConnected && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-yellow-700">
                  Connecting to real-time updates...
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
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
                
                {/* Bid Controls */}
                {participantId && auction.currentItem && (
                  <BidControls 
                    roomId={roomId}
                    itemId={auction.currentItem.id}
                    participantId={participantId}
                    currentPrice={auction.currentItem.currentPrice}
                    minPrice={auction.currentItem.minPrice}
                    disabled={!canBid}
                    onBidPlaced={handleBidPlaced}
                  />
                )}
                
                {/* Bid History */}
                <BidHistory bids={auction.bids} />
                
                {/* Completed Items */}
                {auction.completedItems.length > 0 && (
                  <CompletedItems items={auction.completedItems} />
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Room Status */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-2">Room Status</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${auction.room?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {auction.room?.isActive ? 'Active' : 'Not Started'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Host:</span>
                      <span className="font-medium">
                        {auction.participants.find(p => p.isHost)?.username || 'Unknown'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Items:</span>
                      <span className="font-medium">
                        {auction.items.length}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Completed:</span>
                      <span className="font-medium">
                        {auction.completedItems.length}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Participants List */}
                <ParticipantsList 
                  participants={auction.participants} 
                  currentUserId={participantId || ''}
                />
                
                {/* Upcoming Items */}
                {auction.upcomingItems.length > 0 && (
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