import { useState } from 'react';

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

  const handleAction = async (action: 'start' | 'next' | 'end-current' | 'end') => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement API call to control auction
      const response = await fetch(`/api/rooms/${roomId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to perform action');
      }

      onAction(action);
    } catch (err: any) {
      setError(err.message || 'Failed to perform action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Host Controls</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        {!isActive && (
          <button
            onClick={() => handleAction('start')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Start Auction
          </button>
        )}
        
        {isActive && hasCurrentItem && (
          <button
            onClick={() => handleAction('end-current')}
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
          >
            End Current Item
          </button>
        )}
        
        {isActive && hasNextItem && (
          <button
            onClick={() => handleAction('next')}
            disabled={loading || (hasCurrentItem && false)} // Disable if current item is active
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Move to Next Item
          </button>
        )}
        
        {isActive && (
          <button
            onClick={() => handleAction('end')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            End Auction
          </button>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          {loading
            ? 'Processing...'
            : isActive
            ? 'Auction is active'
            : 'Auction has not started yet'}
        </p>
      </div>
    </div>
  );
}