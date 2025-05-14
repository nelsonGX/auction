import Image from 'next/image';
import { AuctionItem } from '../../lib/types';

interface CompletedItemsProps {
  items: AuctionItem[];
}

export default function CompletedItems({ items }: CompletedItemsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Completed Items</h3>
        <p className="text-gray-500 text-center py-4">No completed items yet</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          Completed Items ({items.length})
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.isSold ? (
                      <span className="text-green-600 font-semibold">
                        Sold for {formatCurrency(item.currentPrice)}
                      </span>
                    ) : (
                      <span className="text-yellow-600">
                        Ended without sale
                      </span>
                    )}
                  </p>
                  {item.winner && (
                    <p className="text-sm text-gray-600 mt-1">
                      Winner: {item.winner.username}
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {item.isSold ? (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Sold
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Ended
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}