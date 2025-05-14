"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '../../lib/api';

export default function RoomCreation() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    hostUsername: '',
    startTime: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format start time for API
      const startTimeDate = new Date(formData.startTime);
      
      // Validate date
      if (startTimeDate < new Date()) {
        throw new Error('Start time must be in the future');
      }

      // Use the API client to create a room
      const data = await roomApi.create({
        name: formData.name,
        password: formData.password,
        hostUsername: formData.hostUsername,
        startTime: startTimeDate.toISOString(),
      });
      
      // Redirect to host dashboard
      router.push(`/host/${data.roomId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get minimum date-time string for the input
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // At least 5 minutes in the future
    return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Auction Room</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Room Name
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Room Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            This password will be used to access the host dashboard.
          </p>
        </div>
        
        <div>
          <label htmlFor="hostUsername" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name (Host)
          </label>
          <input
            type="text"
            id="hostUsername"
            name="hostUsername"
            value={formData.hostUsername}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            min={getMinDateTime()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Auction Room'}
        </button>
      </form>
    </div>
  );
}