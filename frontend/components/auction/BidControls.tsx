import { useState } from 'react';
import { bidApi } from '../../lib/api';

interface BidControlsProps {
  roomId: string;
  itemId: string | null;
  participantId: string;
  currentPrice: number;
  minPrice: number;
  disabled: boolean;
  onBidPlaced: () => void;
}

export default function BidControls({
  roomId,
  itemId,
  participantId,
  currentPrice,
  minPrice,
  disabled,
  onBidPlaced,
}: BidControlsProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Calculate minimum bid (current price + 1 or minimum price if no bids yet)
  const minimumBid = currentPrice > 0 ? currentPrice + 1 : minPrice;

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId) {
      setError('No active item to bid on');
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount)) {
      setError('Please enter a valid bid amount');
      return;
    }

    if (amount < minimumBid) {
      setError(`Bid must be at least ${minimumBid}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use API client to place bid
      await bidApi.placeBid(roomId, participantId, itemId, amount);

      setBidAmount('');
      onBidPlaced();
    } catch (err: any) {
      setError(err.message || 'Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Quick bid buttons (current + 5, +10, +50)
  const quickBidOptions = [5, 10, 50];

  const handleQuickBid = (increment: number) => {
    setBidAmount((minimumBid + increment).toString());
    setError('');
  };

  console.log('Rendering BidControls with:', { roomId, itemId, participantId, currentPrice, minPrice, disabled });

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 border-2 border-red-500">
      <h3 className="text-xl font-semibold mb-4">Place Your Bid</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Your Bid (Minimum: {formatCurrency(minimumBid)})
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              $
            </span>
            <input
              type="number"
              id="bidAmount"
              value={bidAmount}
              onChange={handleBidChange}
              min={minimumBid}
              step="0.01"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={minimumBid.toString()}
              disabled={disabled || loading}
              required
            />
          </div>
        </div>
        
        {/* Quick bid buttons */}
        <div className="flex gap-2 mb-4">
          {quickBidOptions.map(increment => (
            <button
              key={increment}
              type="button"
              onClick={() => handleQuickBid(increment)}
              disabled={disabled || loading}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm disabled:opacity-50"
            >
              +{formatCurrency(increment)}
            </button>
          ))}
        </div>
        
        <button
          type="submit"
          disabled={disabled || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
        >
          {loading ? 'Placing Bid...' : 'Place Bid'}
        </button>
        
        {disabled && !loading && (
          <p className="mt-2 text-sm text-center text-gray-500">
            {!itemId 
              ? 'Waiting for an item to become active'
              : 'You cannot bid at this time'}
          </p>
        )}
      </form>
    </div>
  );
}