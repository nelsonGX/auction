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
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Bid History</h3>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No bids yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bids.map((bid) => (
              <li key={bid.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{bid.participant.username}</p>
                  <p className="text-sm text-gray-500">{formatTime(bid.timestamp)}</p>
                </div>
                <p className="font-semibold text-blue-600">{formatCurrency(bid.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}