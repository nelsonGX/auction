import { useState } from 'react';
import Image from 'next/image';
import { AuctionItem } from '../../lib/types';
import { itemApi } from '../../lib/api';

interface ItemQueueProps {
  roomId: string;
  items: AuctionItem[];
  onItemsReordered: () => void;
}

export default function ItemQueue({ roomId, items, onItemsReordered }: ItemQueueProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sort items by position
  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle drag start
  const handleDragStart = (itemId: string) => {
    setDraggingId(itemId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    
    if (!draggingId || draggingId === targetItemId) {
      setDraggingId(null);
      return;
    }

    // Find the items
    const draggedItem = items.find(item => item.id === draggingId);
    const targetItem = items.find(item => item.id === targetItemId);
    
    if (!draggedItem || !targetItem) {
      setDraggingId(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the dragged item's position to the target item's position
      await itemApi.updatePosition(roomId, draggingId, targetItem.position);
      
      // Refresh the items list
      onItemsReordered();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder items');
    } finally {
      setLoading(false);
      setDraggingId(null);
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await itemApi.deleteItem(roomId, itemId);
      onItemsReordered();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Auction Queue</h3>
        <p className="text-gray-500 text-center py-4">
          No items added to this auction yet
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          Auction Queue ({items.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Drag and drop items to reorder
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className={`max-h-96 overflow-y-auto ${loading ? 'opacity-70' : ''}`}>
        <ul className="divide-y divide-gray-100">
          {sortedItems.map((item) => (
            <li 
              key={item.id} 
              draggable 
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`p-4 hover:bg-gray-50 cursor-move relative ${
                draggingId === item.id ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-gray-400">
                  {item.position}.
                </div>
                
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
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    Starting at {formatCurrency(item.minPrice)}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-gray-400 hover:text-red-600 focus:outline-none"
                    title="Delete Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}