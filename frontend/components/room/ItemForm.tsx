import { useState } from 'react';
import { itemApi, roomApi } from '../../lib/api';

interface ItemFormProps {
  roomId: string;
  onItemAdded: () => void;
}

export default function ItemForm({ roomId, onItemAdded }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    minPrice: '',
    timeoutSecs: '60', // Default timeout of 60 seconds
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try to use session reconnection first (in case session was lost)
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
      
      // Use API client to add item
      await itemApi.createItem(roomId, {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined, // Don't send if empty
        minPrice: parseFloat(formData.minPrice),
        timeoutSecs: parseInt(formData.timeoutSecs),
      });

      // Reset form after successful submission
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        minPrice: '',
        timeoutSecs: '60',
      });

      // Notify parent component
      onItemAdded();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to add item. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700 animate-fade-in">
      <h3 className="text-xl font-semibold mb-5 text-zinc-100">Add Auction Item</h3>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-in">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
            Item Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter item name"
            required
          />
        </div>
        
        <div className="animate-slide-in" style={{ animationDelay: '50ms' }}>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
            placeholder="Describe the item (optional)"
          />
        </div>
        
        <div className="animate-slide-in" style={{ animationDelay: '100ms' }}>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-300 mb-2">
            Image URL <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-in" style={{ animationDelay: '150ms' }}>
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-zinc-300 mb-2">
              Minimum Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                $
              </span>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={formData.minPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="timeoutSecs" className="block text-sm font-medium text-zinc-300 mb-2">
              Bidding Timeout
            </label>
            <select
              id="timeoutSecs"
              name="timeoutSecs"
              value={formData.timeoutSecs}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
              appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M10%2012l-6-6h12l-6%206z%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat"
              required
            >
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
              <option value="180">3 minutes</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          focus:ring-offset-zinc-800 disabled:opacity-50 font-medium transition-all duration-200
          transform hover:translate-y-[-2px] active:translate-y-[1px] animate-slide-in"
          style={{ animationDelay: '200ms' }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Adding Item...
            </span>
          ) : (
            'Add Item'
          )}
        </button>
      </form>
    </div>
  );
}