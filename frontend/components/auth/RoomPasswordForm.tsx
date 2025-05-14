import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { roomApi } from '../../lib/api';
import { setHostAuthentication, testLocalStorage, debugAuthState } from '../../utils/debugHelpers';

type RoomPasswordFormProps = {
  onAuthentication?: (hostId: string) => void;
};

export default function RoomPasswordForm({ onAuthentication }: RoomPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Get roomId from URL parameters
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('RoomPasswordForm: handleSubmit called');
    setLoading(true);
    setError('');

    // Check if roomId is valid
    if (!roomId || roomId === 'undefined') {
      console.log('RoomPasswordForm: Invalid roomId:', roomId);
      setError('Invalid room ID. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    try {
      console.log('RoomPasswordForm: Attempting to authenticate with password:', password ? '(password provided)' : '(no password)');
      // Use API client to authenticate room password
      const result = await roomApi.authenticate(roomId, password);
      console.log('RoomPasswordForm: Authentication result:', result);
      
      if (!result.authenticated) {
        console.log('RoomPasswordForm: Authentication failed');
        throw new Error('Invalid password');
      }
      
      // Extract room's host ID from the room object if needed
      // This assumes the hostId is not directly returned in the auth response
      const hostId = result.id || (result.room && result.room.hostId);
      
      console.log('RoomPasswordForm: Extracted hostId:', hostId);
      console.log('RoomPasswordForm: Result contains id?', !!result.id);
      console.log('RoomPasswordForm: Room contains hostId?', !!(result.room && result.room.hostId));
      console.log('RoomPasswordForm: onAuthentication exists?', !!onAuthentication);
      
      // Force authentication with a generated ID if none is available
      const finalHostId = hostId || `generated-host-${Date.now()}`;
      
      // Call the authentication callback if provided
      if (onAuthentication) {
        console.log('RoomPasswordForm: Calling onAuthentication callback with hostId:', finalHostId);
        onAuthentication(finalHostId);
      } else {
        console.log('RoomPasswordForm: No callback provided, redirecting to host dashboard');
        // Redirect to host dashboard if no callback provided
        router.push(`/host/${roomId}`);
      }
    } catch (err) {
      console.error('RoomPasswordForm: Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Test localStorage functionality and debug the auth state
  const handleDebug = () => {
    console.log('Debug button clicked');
    console.log('RoomId:', roomId);
    console.log('onAuthentication exists:', !!onAuthentication);
    console.log('onAuthentication type:', typeof onAuthentication);
    
    // Test localStorage
    const isLocalStorageWorking = testLocalStorage();
    console.log('LocalStorage working:', isLocalStorageWorking);
    
    // Look at existing data
    debugAuthState(roomId || '');
    
    if (!roomId) {
      console.error('Cannot manually set auth - roomId is missing');
      return;
    }
    
    // Force authentication with a generated ID
    console.log('Attempting to force authentication');
    
    // Set a test host ID for debugging
    const testHostId = 'direct-test-host-id-' + Date.now();
    console.log('Generated test host ID:', testHostId);
    
    if (onAuthentication) {
      console.log('Direct call to onAuthentication');
      try {
        onAuthentication(testHostId);
        console.log('onAuthentication call completed');
      } catch (error) {
        console.error('Error calling onAuthentication:', error);
      }
    } else {
      console.log('No onAuthentication callback available');
      
      // Try to set localStorage directly
      const success = setHostAuthentication(roomId, testHostId);
      console.log('Manual localStorage set result:', success);
      
      if (success) {
        // Force reload the page
        console.log('Reloading page...');
        window.location.reload();
      }
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
        
        {/* Debug button - only for development */}
        <button 
          type="button"
          className="w-full mt-4 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
          onClick={handleDebug}
        >
          Debug Authentication (Dev Only)
        </button>
      </form>
    </div>
  );
}