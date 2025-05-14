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

      // Use the API client to create a room
      const data = await roomApi.create({
        name: formData.name,
        password: formData.password,
        hostUsername: formData.hostUsername,
      });
      
      // Redirect to host dashboard
      router.push(`/host/${data.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create room. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">Create Auction Room</h2>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-in">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
            Room Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter room name"
            required
          />
        </div>
        
        <div className="animate-slide-in" style={{ animationDelay: '50ms' }}>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
            Room Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Create a secure password"
            required
          />
          <p className="mt-2 text-xs text-zinc-500">
            This password will be used to access the host dashboard.
          </p>
        </div>
        
        <div className="animate-slide-in" style={{ animationDelay: '100ms' }}>
          <label htmlFor="hostUsername" className="block text-sm font-medium text-zinc-300 mb-2">
            Your Name (Host)
          </label>
          <input
            type="text"
            id="hostUsername"
            name="hostUsername"
            value={formData.hostUsername}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter your name"
            required
          />
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
              Creating...
            </span>
          ) : (
            'Create Auction Room'
          )}
        </button>
      </form>
    </div>
  );
}