// Room types
export interface AuctionRoom {
  id: string;
  name: string;
  hostUsername: string;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  createdAt: string;
  currentItemId: string | null;
  currentItem: AuctionItem | null;
}

// Item types
export interface AuctionItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPrice: number;
  currentPrice: number;
  timeoutSecs: number;
  position: number;
  isActive: boolean;
  isSold: boolean;
  endedManually: boolean;
  endedAt: string | null;
  roomId: string;
  winnerId: string | null;
  winner: Participant | null;
}

// Participant types
export interface Participant {
  id: string;
  username: string;
  isHost: boolean;
  roomId: string;
}

// Bid types
export interface Bid {
  id: string;
  amount: number;
  timestamp: string;
  participantId: string;
  participant: {
    username: string;
  };
  itemId: string;
  roomId: string;
}

// WebSocket event types
export type WebSocketEvent =
  | { type: 'room:start' }
  | { type: 'room:end' }
  | { type: 'participant:join', participant: Participant }
  | { type: 'item:next', item: AuctionItem }
  | { type: 'item:bid', bid: Bid }
  | { type: 'item:timeout:warning', secondsLeft: number }
  | { type: 'item:sold', item: AuctionItem, winner: Participant }
  | { type: 'item:manually_ended', item: AuctionItem, winner: Participant | null };

// API response types
export interface CreateRoomResponse {
  id: string;
}

export interface JoinRoomResponse {
  participantId: string;
}

// Form data types
export interface CreateRoomFormData {
  name: string;
  password: string;
  hostUsername: string;
  startTime: string;
}

export interface ItemFormData {
  name: string;
  description: string;
  imageUrl: string;
  minPrice: number;
  timeoutSecs: number;
}