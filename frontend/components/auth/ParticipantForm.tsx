import { useState } from 'react';
import { participantApi } from '../../lib/api';

interface ParticipantFormProps {
  roomId: string;
  onJoin: (participantId: string, username: string) => void;
}

export default function ParticipantForm({ roomId, onJoin }: ParticipantFormProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Use API client to join room as participant
      const data = await participantApi.join(roomId, username);
      onJoin(data.participantId, username);
    } catch (err: any) {
      setError(err.message || 'Failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Join Auction</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Auction'}
        </button>
      </form>
    </div>
  );
}