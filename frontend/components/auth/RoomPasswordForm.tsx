import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '../../lib/api';

interface RoomPasswordFormProps {
  roomId: string;
}

export default function RoomPasswordForm({ roomId }: RoomPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if roomId is valid
    if (!roomId || roomId === 'undefined') {
      setError('Invalid room ID. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    try {
      // Use API client to authenticate room password
      const result = await roomApi.authenticate(roomId, password);
      
      if (!result.success) {
        throw new Error('Invalid password');
      }

      // Redirect to host dashboard upon successful authentication
      router.push(`/host/${roomId}`);
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Enter Room Password</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Access Host Dashboard'}
        </button>
      </form>
    </div>
  );
}