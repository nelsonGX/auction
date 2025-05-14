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
      <div className="w-full bg-zinc-800 rounded-lg shadow-lg p-8 text-center border border-zinc-700 animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-zinc-300">
          No active item currently
        </h3>
        <p className="text-zinc-500 mt-3 flex items-center justify-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
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
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg overflow-hidden border border-zinc-700 animate-fade-in">
      {/* Item Header */}
      <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-zinc-100">
          Currently Auctioning
        </h3>
        {item.isSold && (
          <span className="ml-auto bg-green-900/30 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-800">
            Sold
          </span>
        )}
        {!item.isSold && item.isActive && (
          <span className="ml-auto bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-800 animate-pulse">
            Active
          </span>
        )}
      </div>
      
      {/* Item Content */}
      <div className="p-6">
        {/* Item Image */}
        {item.imageUrl ? (
          <div className="relative w-full h-64 mb-5 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 group">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="transition-transform duration-700 group-hover:scale-105"
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 mb-5 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Item Details */}
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-zinc-100">{item.name}</h4>
          
          {item.description && (
            <p className="text-zinc-400 leading-relaxed">{item.description}</p>
          )}
          
            {/* Price and Status */}
            <div className="pt-5 mt-2 border-t border-zinc-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Current Bid
              </p>
              <p className="text-2xl font-bold text-blue-400 animate-scale group">
              <span className="inline-block group-[.price-updated]:animate-shake">
                {formatCurrency(item.currentPrice || item.minPrice)}
              </span>
              </p>
              {item.currentPrice === 0 && (
              <p className="text-xs mt-1 text-zinc-500">
                Starting at {formatCurrency(item.minPrice)}
              </p>
              )}
            </div>
            
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <p className="text-sm text-zinc-400 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time Remaining
              </p>
              <p className={`text-2xl font-semibold ${
                timeRemaining && timeRemaining < 30 
                  ? 'text-red-400 animate-pulse' 
                  : 'text-zinc-100'
              }`}>
                {timeRemaining !== null 
                  ? formatTimeRemaining(timeRemaining)
                  : 'Auction in progress'}
              </p>
              {timeRemaining && timeRemaining < 30 && (
                <p className="text-xs mt-1 text-red-400">
                  Ending soon!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}