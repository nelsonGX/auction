import { useState } from 'react';
import Image from 'next/image';
import { AuctionItem } from '../../lib/types';
import { itemApi, roomApi } from '../../lib/api';

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

  // Function to try reconnecting session if needed
  const attemptSessionReconnect = async () => {
    try {
      const storedAuth = localStorage.getItem(`host_auth_${roomId}`);
      if (storedAuth) {
        const { id } = JSON.parse(storedAuth);
        await roomApi.reconnectSession(roomId, id).catch(err => {
          console.warn('Session reconnect failed:', err);
        });
      }
    } catch (reconnectErr) {
      console.warn('Error during session reconnection attempt:', reconnectErr);
    }
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
      // Try to reconnect session first
      await attemptSessionReconnect();

      // Update the dragged item's position to the target item's position
      await itemApi.updatePosition(roomId, draggingId, targetItem.position);
      
      // Refresh the items list
      onItemsReordered();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reorder items');
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
      // Try to reconnect session first
      await attemptSessionReconnect();
      
      await itemApi.deleteItem(roomId, itemId);
      onItemsReordered();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4 text-zinc-100">Auction Queue</h3>
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-center">
            No items added to this auction yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg overflow-hidden border border-zinc-700 animate-fade-in">
      <div className="bg-zinc-800 p-4 border-b border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-100">
          Auction Queue <span className="ml-1 px-2 py-0.5 text-sm bg-zinc-700 rounded-full">{items.length}</span>
        </h3>
        <p className="text-sm text-zinc-400 mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Drag and drop items to reorder
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-900/30 border-b border-red-800 animate-fade-in">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      <div className={`max-h-96 overflow-y-auto ${loading ? 'opacity-70' : ''} bg-zinc-900/30`}>
        <ul className="divide-y divide-zinc-800">
          {sortedItems.map((item, index) => (
            <li 
              key={item.id} 
              draggable 
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`p-4 hover:bg-zinc-700/30 cursor-move relative transition-colors duration-150
                animate-slide-in ${draggingId === item.id ? 'bg-blue-900/20 border border-blue-800' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-zinc-500 font-mono">
                  {item.position}.
                </div>
                
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="transition-transform duration-300 hover:scale-110"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                    <span className="text-zinc-500 text-xs">No image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-sm text-zinc-400 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-blue-400 mt-1">
                    Starting at {formatCurrency(item.minPrice)}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-zinc-400 hover:text-red-400 focus:outline-none 
                    transition-colors duration-200 p-1 hover:bg-red-900/30 rounded"
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