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
      <div className="w-full bg-zinc-800 rounded-lg shadow-md p-6 border border-zinc-700">
        <h3 className="text-lg font-semibold mb-4 text-zinc-100">Completed Items</h3>
        <p className="text-zinc-400 text-center py-4">No completed items yet</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-md overflow-hidden border border-zinc-700">
      <div className="bg-zinc-900 p-4 border-b border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-100">
          Completed Items ({items.length})
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <ul className="divide-y divide-zinc-700">
          {items.map((item) => (
            <li key={item.id} className="p-4 hover:bg-zinc-700">
              <div className="flex items-start space-x-4">
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 flex-shrink-0 bg-zinc-700 rounded overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 bg-zinc-700 rounded flex items-center justify-center">
                    <span className="text-zinc-400 text-xs">No image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-zinc-400 truncate">
                    {item.isSold ? (
                      <span className="text-emerald-400 font-semibold">
                        Sold for {formatCurrency(item.currentPrice)}
                      </span>
                    ) : (
                      <span className="text-amber-400">
                        Ended without sale
                      </span>
                    )}
                  </p>
                  {item.winner && (
                    <p className="text-sm text-zinc-400 mt-1">
                      Winner: {item.winner.username}
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {item.isSold ? (
                    <span className="inline-block px-2 py-1 text-xs bg-emerald-900/50 text-emerald-400 rounded-full border border-emerald-700">
                      Sold
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs bg-amber-900/50 text-amber-400 rounded-full border border-amber-700">
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