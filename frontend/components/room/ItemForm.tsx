import { useState } from 'react';
import { itemApi } from '../../lib/api';

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
    } catch (err: any) {
      setError(err.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Add Auction Item</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Price
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={formData.minPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="timeoutSecs" className="block text-sm font-medium text-gray-700 mb-1">
              Timeout (seconds)
            </label>
            <select
              id="timeoutSecs"
              name="timeoutSecs"
              value={formData.timeoutSecs}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
}