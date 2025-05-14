import Image from 'next/image';
import { AuctionItem } from '../../lib/types';

interface UpcomingItemsProps {
  items: AuctionItem[];
}

export default function UpcomingItems({ items }: UpcomingItemsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-zinc-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Items</h3>
        <p className="text-white text-center py-4">No upcoming items</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-md overflow-hidden">
      <div className="bg-zinc-800 p-4 border-b border-zinc-600">
        <h3 className="text-lg font-semibold text-white">
          Upcoming Items ({items.length})
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <ul className="divide-y divide-zinc-700">
          {items.map((item) => (
            <li key={item.id} className="p-4 hover:bg-zinc-700">
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
                  <p className="text-sm font-medium text-white truncate">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-zinc-200 mt-1">
                    Starting at {formatCurrency(item.minPrice)}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-xs text-zinc-200">
                  <span className="inline-block px-2 py-1 bg-zinc-700 rounded-full">
                    Position {item.position}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}