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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">Join Auction</h2>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-in">
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter your name to join"
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
          style={{ animationDelay: '100ms' }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Joining...
            </span>
          ) : (
            'Join Auction'
          )}
        </button>
      </form>
      
      <div className="mt-6 flex justify-center space-x-2 animate-fade-in">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '600ms' }}></div>
      </div>
    </div>
  );
}