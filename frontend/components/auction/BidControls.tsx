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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bid. Please try again.';
      setError(errorMessage);
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
  const quickBidOptions = [1, 5, 10, 50, 100];

  const handleQuickBid = (increment: number) => {
    setBidAmount((minimumBid + increment).toString());
    setError('');
  };

  

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg p-6 border border-blue-600/50 animate-fade-in">
      <h3 className="text-xl font-semibold mb-4 text-zinc-100">Place Your Bid</h3>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="bidAmount" className="block text-sm font-medium text-zinc-300 mb-2">
            Your Bid <span className="text-blue-400 font-semibold">(Minimum: {formatCurrency(minimumBid)})</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              $
            </span>
            <input
              type="number"
              id="bidAmount"
              value={bidAmount}
              onChange={handleBidChange}
              min={minimumBid}
              step="0.01"
              className="w-full pl-8 pr-3 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder={minimumBid.toString()}
              disabled={disabled || loading}
              required
            />
          </div>
        </div>
        
        {/* Quick bid buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickBidOptions.map(increment => (
            <button
              key={increment}
              type="button"
              onClick={() => handleQuickBid(increment)}
              disabled={disabled || loading}
              className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 
              focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm disabled:opacity-50
              transition-all duration-200 animate-scale"
            >
              +{formatCurrency(increment)}
            </button>
          ))}
        </div>
        
        <button
          type="submit"
          disabled={disabled || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
          transform hover:translate-y-[-2px] active:translate-y-[1px]"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Placing Bid...
            </span>
          ) : (
            'Place Bid'
          )}
        </button>
        
        {disabled && !loading && (
          <p className="mt-3 text-sm text-center text-zinc-400">
            {!itemId 
              ? 'Waiting for an item to become active...'
              : 'You cannot bid at this time'}
          </p>
        )}
      </form>
    </div>
  );
}