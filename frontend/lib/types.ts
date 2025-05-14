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

// WebSocket event types - payload for each event type
export interface WebSocketEvent {
  // Common properties across events
  room?: AuctionRoom;
  participant?: Participant;
  item?: AuctionItem;
  currentItem?: AuctionItem;
  currentItemId?: string;
  items?: AuctionItem[];
  bid?: Bid;
  secondsLeft?: number;
  winner?: Participant | null;
  
  // For flexibility and future properties
  [key: string]: any;
}

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