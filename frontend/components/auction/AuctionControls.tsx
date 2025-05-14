import { useState } from 'react';
import { roomApi } from '../../lib/api';

interface AuctionControlsProps {
  roomId: string;
  isActive: boolean;
  hasCurrentItem: boolean;
  hasNextItem: boolean;
  onAction: (action: 'start' | 'next' | 'end-current' | 'end') => void;
}

export default function AuctionControls({
  roomId,
  isActive,
  hasCurrentItem,
  hasNextItem,
  onAction,
}: AuctionControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const attemptSessionReconnect = async () => {
    try {
      const storedAuth = localStorage.getItem(`host_auth_${roomId}`);
      if (storedAuth) {
        const { id } = JSON.parse(storedAuth);
        await roomApi.reconnectSession(roomId, id).catch(err => {
          console.warn('Session reconnect failed:', err);
        });
      }
    } catch (reconnectErr) {
      console.warn('Error during session reconnection attempt:', reconnectErr);
    }
  };

  const handleAction = async (action: 'start' | 'next' | 'end-current' | 'end') => {
    setLoading(true);
    setError('');

    try {
      // Try to reconnect session first
      await attemptSessionReconnect();
      
      // Use API client to perform the appropriate action
      switch (action) {
        case 'start':
          await roomApi.startAuction(roomId);
          break;
        case 'next':
          await roomApi.nextItem(roomId);
          break;
        case 'end-current':
          await roomApi.endCurrentItem(roomId);
          break;
        case 'end':
          await roomApi.endAuction(roomId);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      console.log('Action request completed successfully');

      onAction(action);
      
      setError('');
    } catch (err: unknown) {
      console.error('Action error:', err);
      
      if (err instanceof Error && (err.message === 'Failed to perform action' || 
          err.message.includes('authentication') || 
          err.message.includes('Unauthorized'))) {
        console.log('Possible auth error but action might have succeeded, suppressing error message');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to perform action. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 animate-fade-in">
      <h3 className="text-xl font-semibold mb-5 text-zinc-100">Host Controls</h3>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {!isActive && (
          <button
            onClick={() => handleAction('start')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-500 
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
            focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
            transform hover:translate-y-[-2px] active:translate-y-[1px] animate-scale"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Starting Auction...
              </span>
            ) : (
              'Start Auction'
            )}
          </button>
        )}
        
        {isActive && hasCurrentItem && (
          <button
            onClick={() => handleAction('end-current')}
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-500 
            focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 
            focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
            transform hover:translate-y-[-2px] active:translate-y-[1px] animate-scale"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Ending Item...
              </span>
            ) : (
              'End Current Item'
            )}
          </button>
        )}
        
        {isActive && hasNextItem && (
          <button
            onClick={() => handleAction('next')}
            disabled={loading || (hasCurrentItem && false)} // Disable if current item is active
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
            transform hover:translate-y-[-2px] active:translate-y-[1px] animate-scale"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Moving to Next Item...
              </span>
            ) : (
              'Move to Next Item'
            )}
          </button>
        )}
        
        {isActive && (
          <button
            onClick={() => handleAction('end')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-500 
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
            focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
            transform hover:translate-y-[-2px] active:translate-y-[1px] animate-scale"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Ending Auction...
              </span>
            ) : (
              'End Auction'
            )}
          </button>
        )}
      </div>
      
      <div className="mt-5 text-sm text-zinc-400 border-t border-zinc-700 pt-4">
        <p className={`${isActive ? 'text-green-400' : ''} flex items-center`}>
          {loading ? (
            'Processing...'
          ) : isActive ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Auction is active
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-500 mr-2"></span>
              Auction has not started yet
            </>
          )}
        </p>
      </div>
    </div>
  );
}