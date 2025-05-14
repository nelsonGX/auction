interface Bid {
  id: string;
  amount: number;
  timestamp: string;
  participantId: string;
  participant: {
    username: string;
  };
}

interface BidHistoryProps {
  bids: Bid[];
}

export default function BidHistory({ bids }: BidHistoryProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg overflow-hidden border border-zinc-700 animate-fade-in">
      <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">Bid History</h3>
        <span className="ml-auto bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full text-xs font-medium">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
        </span>
      </div>
      
      <div className="max-h-80 overflow-y-auto bg-zinc-900/30">
        {bids.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-zinc-500">No bids placed yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {bids.map((bid, index) => (
              <li 
                key={bid.id} 
                className="flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center mr-3 text-zinc-400">
                    {bid.participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">{bid.participant.username}</p>
                    <p className="text-xs text-zinc-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(bid.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-400">{formatCurrency(bid.amount)}</p>
                  {index === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full border border-blue-800">
                      Highest
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}