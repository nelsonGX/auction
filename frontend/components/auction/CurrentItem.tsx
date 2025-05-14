import Image from 'next/image';

interface AuctionItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPrice: number;
  currentPrice: number;
  timeoutSecs: number;
  isActive: boolean;
  isSold: boolean;
}

interface CurrentItemProps {
  item: AuctionItem | null;
  timeRemaining: number | null; // Time remaining in seconds
}

export default function CurrentItem({ item, timeRemaining }: CurrentItemProps) {
  if (!item) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-500">
          No active item currently
        </h3>
        <p className="text-gray-400 mt-2">
          Waiting for the auction to start...
        </p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Item Header */}
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-xl font-semibold text-gray-800">
          Currently Auctioning
        </h3>
      </div>
      
      {/* Item Content */}
      <div className="p-6">
        {/* Item Image */}
        {item.imageUrl ? (
          <div className="relative w-full h-64 mb-4 bg-gray-100 rounded overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="w-full h-32 mb-4 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        
        {/* Item Details */}
        <div className="space-y-4">
          <h4 className="text-2xl font-bold">{item.name}</h4>
          
          {item.description && (
            <p className="text-gray-600">{item.description}</p>
          )}
          
          {/* Price and Status */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Current Bid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(item.currentPrice || item.minPrice)}
                </p>
                {item.currentPrice === 0 && (
                  <p className="text-sm text-gray-500">
                    Starting at {formatCurrency(item.minPrice)}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Time Remaining</p>
                <p className={`text-xl font-semibold ${
                  timeRemaining && timeRemaining < 30 ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {timeRemaining !== null 
                    ? formatTimeRemaining(timeRemaining)
                    : 'Auction in progress'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}