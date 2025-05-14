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

// Helper for fetch requests
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(getFullApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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