import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { roomApi } from '../../lib/api';

type RoomPasswordFormProps = {
  onAuthentication?: (hostId: string) => void;
};

export default function RoomPasswordForm({ onAuthentication }: RoomPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExistingAuth, setCheckingExistingAuth] = useState(true);
  const authProcessedRef = useRef(false);
  const router = useRouter();

  // Get roomId from URL parameters
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  // Check for existing auth when component mounts
  useEffect(() => {
    async function checkExistingAuth() {
      if (!roomId || authProcessedRef.current) {
        setCheckingExistingAuth(false);
        return;
      }
      
      try {        
        // First check for session-based auth
        const sessionCheck = await roomApi.checkHostAuth(roomId);
        
        
        if (sessionCheck.authenticated && sessionCheck.hostId) {
          authProcessedRef.current = true;
          
          if (onAuthentication) {
            onAuthentication(sessionCheck.hostId);
          } else {
            router.push(`/host/${roomId}`);
          }
          return;
        }
        
        // Then check localStorage as fallback
        const key = `host_auth_${roomId}`;
        const storedAuth = localStorage.getItem(key);
        
        if (storedAuth) {
          try {
            const parsedAuth = JSON.parse(storedAuth);
            
            
            if (parsedAuth.authenticated && parsedAuth.id) {
              // Try to establish a session using the localStorage credentials
              try {
                const reconnectResult = await roomApi.reconnectSession(roomId, parsedAuth.id);
                if (reconnectResult.success) {
                  // Successfully established session from localStorage
                  authProcessedRef.current = true;
                  
                  if (onAuthentication) {
                    onAuthentication(parsedAuth.id);
                  } else {
                    router.push(`/host/${roomId}`);
                  }
                  return;
                }
              } catch (reconnectErr) {
                console.error('RoomPasswordForm: Failed to reconnect session:', reconnectErr);
                // Continue to password form
              }
            }
          } catch (parseErr) {
            console.error('RoomPasswordForm: Error parsing localStorage auth:', parseErr);
            localStorage.removeItem(key);
          }
        }
      } catch (err) {
        console.error('RoomPasswordForm: Error checking existing auth:', err);
      } finally {
        setCheckingExistingAuth(false);
      }
    }
    
    checkExistingAuth();
  }, [roomId, onAuthentication, router]);

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
      
      // Use API client to authenticate room password (this will set the session cookie)
      const result = await roomApi.authenticate(roomId, password);
      
      
      if (!result.authenticated) {
        throw new Error('Invalid password');
      }
      
      // Extract room's host ID from result
      const hostId = result.id || (result.room && result.room.hostId);
      
      
      
      
      
      
      // Force authentication with a generated ID if none is available
      // Ensure finalHostId is always a string
      const finalHostId = typeof hostId === 'string' ? hostId : `generated-host-${Date.now()}`;
      
      // Store authentication in localStorage as backup
      try {
        const authState = {
          authenticated: true,
          id: finalHostId,
        };
        localStorage.setItem(`host_auth_${roomId}`, JSON.stringify(authState));
        
      } catch (storageErr) {
        console.error('RoomPasswordForm: Error saving to localStorage:', storageErr);
      }
      
      // Verify session was established by checking with the server
      try {
        const sessionCheck = await roomApi.checkHostAuth(roomId);
        
        
        if (!sessionCheck.authenticated) {
          console.warn('RoomPasswordForm: Session not established properly, but continuing with localStorage');
        }
      } catch (sessionErr) {
        console.error('RoomPasswordForm: Session verification error:', sessionErr);
      }
      
      authProcessedRef.current = true;
      if (onAuthentication) {
        
        onAuthentication(finalHostId);
        setTimeout(() => window.location.reload(), 100);
      } else {
        router.push(`/host/${roomId}`);
        setTimeout(() => window.location.reload(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking for existing auth
  if (checkingExistingAuth) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">Checking Authentication</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center text-zinc-400">Checking for existing authentication...</p>
      </div>
    );
  }

  // Show password form if no existing auth was found
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 animate-fade-in animate-slide-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">Enter Room Password</h2>
      
      {error && (
        <div className="mb-5 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Enter room password"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-500 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          focus:ring-offset-zinc-800 disabled:opacity-50 transition-all duration-200 
          transform hover:translate-y-[-2px] active:translate-y-[1px]"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </span>
          ) : (
            'Access Host Dashboard'
          )}
        </button>
      </form>
    </div>
  );
}