import { 
  CreateRoomFormData, 
  ItemFormData, 
  CreateRoomResponse,
  JoinRoomResponse,
  AuctionRoom,
  AuctionItem,
  Participant,
  Bid
} from './types';

import { getApiUrl } from '../utils/apiHelpers';

// Helper function to get full API URL
const getFullApiUrl = (endpoint: string) => {
  return getApiUrl(endpoint);
};

// Keep a global cache of room auth for fallback
const authCache: Record<string, string> = {};

// Helper for fetch requests
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  // Check if this is a room-specific endpoint
  const roomIdMatch = endpoint.match(/\/rooms\/([^\/]+)/);
  const roomId = roomIdMatch ? roomIdMatch[1] : null;
  
  // If we have a roomId, try to get auth from localStorage as fallback
  let customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add custom auth header for host operations if possible
  if (roomId) {
    try {
      // First check our cache
      let hostId = authCache[roomId];
      
      // If not in cache, try localStorage
      if (!hostId) {
        const storedAuth = localStorage.getItem(`host_auth_${roomId}`);
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          if (parsed.authenticated && parsed.id) {
            hostId = parsed.id;
            // Store in cache for future use
            authCache[roomId] = hostId;
          }
        }
      }
      
      // If we found a hostId, add it as a header
      if (hostId) {
        customHeaders['X-Host-ID'] = hostId;
        customHeaders['X-Room-ID'] = roomId;
      }
    } catch (err) {
      console.warn('Error preparing auth headers:', err);
    }
  }
  
  const response = await fetch(getFullApiUrl(endpoint), {
    ...options,
    credentials: 'include', // Include cookies for session authentication
    headers: {
      ...customHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

// Room API
export const roomApi = {
  create: (data: CreateRoomFormData): Promise<CreateRoomResponse> => {
    return fetchApi('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRoom: (roomId: string): Promise<AuctionRoom> => {
    return fetchApi(`/rooms/${roomId}`);
  },

  authenticate: (roomId: string, password: string): Promise<{ authenticated: boolean, id: string, room: AuctionRoom }> => {
    console.log('API: authenticate called with roomId:', roomId);
    return fetchApi(`/rooms/${roomId}/auth`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }).then(result => {
      console.log('API: authenticate response:', result);
      return result;
    }).catch(error => {
      console.error('API: authenticate error:', error);
      throw error;
    });
  },
  
  checkHostAuth: (roomId: string): Promise<{ authenticated: boolean, hostId: string | null }> => {
    return fetchApi(`/rooms/${roomId}/host-auth`);
  },
  
  reconnectSession: (roomId: string, hostId: string): Promise<{ success: boolean, authenticated: boolean, hostId: string }> => {
    return fetchApi(`/reconnect-session`, {
      method: 'POST',
      body: JSON.stringify({ roomId, hostId }),
    });
  },

  updateRoom: (roomId: string, data: Partial<AuctionRoom>): Promise<AuctionRoom> => {
    return fetchApi(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  startAuction: (roomId: string): Promise<{ success: boolean }> => {
    return fetchApi(`/rooms/${roomId}/start`, {
      method: 'POST',
    });
  },

  nextItem: (roomId: string): Promise<{ success: boolean }> => {
    return fetchApi(`/rooms/${roomId}/next`, {
      method: 'POST',
    });
  },

  endCurrentItem: (roomId: string): Promise<{ success: boolean }> => {
    return fetchApi(`/rooms/${roomId}/end-current`, {
      method: 'POST',
    });
  },

  endAuction: (roomId: string): Promise<{ success: boolean }> => {
    return fetchApi(`/rooms/${roomId}/end`, {
      method: 'POST',
    });
  },
};

// Item API
export const itemApi = {
  createItem: (roomId: string, data: ItemFormData): Promise<AuctionItem> => {
    return fetchApi(`/rooms/${roomId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getItems: (roomId: string): Promise<AuctionItem[]> => {
    return fetchApi(`/rooms/${roomId}/items`);
  },

  updateItem: (roomId: string, itemId: string, data: Partial<AuctionItem>): Promise<AuctionItem> => {
    return fetchApi(`/rooms/${roomId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteItem: (roomId: string, itemId: string): Promise<{ success: boolean }> => {
    return fetchApi(`/rooms/${roomId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  updatePosition: (roomId: string, itemId: string, position: number): Promise<AuctionItem> => {
    return fetchApi(`/rooms/${roomId}/items/${itemId}/position`, {
      method: 'POST',
      body: JSON.stringify({ position }),
    });
  },
};

// Participant API
export const participantApi = {
  join: (roomId: string, username: string): Promise<JoinRoomResponse> => {
    return fetchApi(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  getParticipants: (roomId: string): Promise<Participant[]> => {
    return fetchApi(`/rooms/${roomId}/participants`);
  },
};

// Bid API
export const bidApi = {
  placeBid: (roomId: string, participantId: string, itemId: string, amount: number): Promise<Bid> => {
    return fetchApi(`/rooms/${roomId}/bid`, {
      method: 'POST',
      body: JSON.stringify({ participantId, itemId, amount }),
    });
  },

  getBids: (roomId: string, itemId: string): Promise<Bid[]> => {
    return fetchApi(`/rooms/${roomId}/items/${itemId}/bids`);
  },
};