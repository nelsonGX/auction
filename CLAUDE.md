# Auction App Architecture

## Overall Structure
- Frontend: Next.js application in `frontend/` folder
- Backend: Node.js API in `backend/` folder
- Database: PostgreSQL with Prisma ORM

## Key Features
- Room creation with room-specific password protection (no user accounts)
- Configurable auction settings (start time, item properties, timeouts)
- Secure, UUID-based room links
- Simple username-based entry for bidders
- Sequential auction of items (one item at a time)
- Manual auction item ending by the room host

## Database Schema (Prisma)

```prisma
// The auction room itself
model AuctionRoom {
  id            String     @id @default(uuid())
  name          String
  password      String     // Hashed password for room access
  hostUsername  String     // Username of the room creator
  startTime     DateTime
  endTime       DateTime?
  isActive      Boolean    @default(false)
  createdAt     DateTime   @default(now())
  items         AuctionItem[]
  participants  Participant[]
  bids          Bid[]
  currentItemId String?    // ID of the currently active item
  currentItem   AuctionItem? @relation("CurrentItem", fields: [currentItemId], references: [id])
}

// Items being auctioned
model AuctionItem {
  id           String      @id @default(uuid())
  name         String
  description  String?
  imageUrl     String?
  minPrice     Float
  currentPrice Float       @default(0)
  timeoutSecs  Int         // Seconds before finalizing after last bid
  position     Int         // Order position in the auction sequence
  isActive     Boolean     @default(false)
  isSold       Boolean     @default(false)
  endedManually Boolean    @default(false)  // Flag for manual ending
  endedAt      DateTime?   // When the auction for this item ended
  roomId       String
  room         AuctionRoom @relation(fields: [roomId], references: [id])
  currentInRoom AuctionRoom[] @relation("CurrentItem")
  bids         Bid[]
  winnerId     String?
  winner       Participant? @relation("WonItems", fields: [winnerId], references: [id])
}

// People participating in the auction
model Participant {
  id       String @id @default(uuid())
  username String
  isHost   Boolean @default(false)  // Flag to indicate if this is the host
  roomId   String
  room     AuctionRoom @relation(fields: [roomId], references: [id])
  bids     Bid[]
  wonItems AuctionItem[] @relation("WonItems")

  @@unique([username, roomId])
}

// Individual bids
model Bid {
  id           String   @id @default(uuid())
  amount       Float
  timestamp    DateTime @default(now())
  participantId String
  participant  Participant @relation(fields: [participantId], references: [id])
  itemId       String
  item         AuctionItem @relation(fields: [itemId], references: [id])
  roomId       String
  room         AuctionRoom @relation(fields: [roomId], references: [id])
}
```

## Frontend Structure (Next.js)

```
frontend/
├── app/
│   ├── page.tsx                  # Landing page with room creation form
│   ├── host/[roomId]/
│   │   └── page.tsx              # Host dashboard (password protected)
│   └── auctions/[roomId]/
│       └── page.tsx              # Public auction view
├── components/
│   ├── auth/
│   │   ├── RoomPasswordForm.tsx  # Enter room password for host access
│   │   └── ParticipantForm.tsx   # Participant entry
│   ├── room/
│   │   ├── RoomCreation.tsx      # Form to create a room
│   │   ├── ItemForm.tsx          # Add/edit auction items
│   │   ├── ItemQueue.tsx         # Manage the sequence of items
│   │   ├── RoomSettings.tsx      # Configure room settings
│   │   └── ShareLink.tsx         # Component to share room link
│   ├── auction/
│   │   ├── CurrentItem.tsx       # Display currently auctioned item
│   │   ├── BidControls.tsx       # Interface for bidding
│   │   ├── BidHistory.tsx        # Show bid history
│   │   ├── Countdown.tsx         # Timer for current auction
│   │   ├── UpcomingItems.tsx     # Preview of upcoming items
│   │   ├── CompletedItems.tsx    # Results of completed items
│   │   ├── ParticipantsList.tsx  # Show active participants
│   │   └── AuctionControls.tsx   # Host controls (next item, end current)
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── api.ts                    # API client
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── hooks/
│   ├── useAuction.ts             # Auction state management
│   └── useRealtime.ts            # WebSocket connection
└── public/
    └── images/                   # Static assets
```

## Backend Structure (Node.js)

```
backend/
├── prisma/
│   └── schema.prisma             # Database schema
├── src/
│   ├── index.ts                  # Entry point
│   ├── config/
│   │   └── env.ts                # Environment variables
│   ├── api/
│   │   ├── routes/
│   │   │   ├── rooms.ts          # Room management
│   │   │   ├── items.ts          # Item management
│   │   │   └── bids.ts           # Bidding endpoints
│   │   └── middleware/
│   │       ├── roomAuth.ts       # Room password verification
│   │       └── validation.ts     # Request validation
│   ├── services/
│   │   ├── room.ts               # Room business logic
│   │   ├── item.ts               # Item business logic
│   │   ├── bid.ts                # Bidding logic
│   │   └── auction.ts            # Auction sequence management
│   ├── websocket/
│   │   ├── server.ts             # WebSocket server
│   │   └── handlers.ts           # WebSocket event handlers
│   └── utils/
│       ├── errors.ts             # Error handling
│       └── logger.ts             # Logging
└── package.json
```

## API Endpoints (Updated)

1. **Room Management**
   - `POST /api/rooms` - Create new auction room
   - `GET /api/rooms/:id` - Get room details (public info)
   - `POST /api/rooms/:id/auth` - Authenticate with room password
   - `PUT /api/rooms/:id` - Update room settings (requires password)
   - `DELETE /api/rooms/:id` - Delete room (requires password)

2. **Item Management**
   - `POST /api/rooms/:roomId/items` - Add item to room (requires password)
   - `GET /api/rooms/:roomId/items` - Get all items in room (public)
   - `PUT /api/rooms/:roomId/items/:id` - Update item (requires password)
   - `DELETE /api/rooms/:roomId/items/:id` - Remove item (requires password)
   - `POST /api/rooms/:roomId/items/:id/position` - Change item position in sequence (requires password)

3. **Auction Controls**
   - `POST /api/rooms/:roomId/start` - Start the auction (requires password)
   - `POST /api/rooms/:roomId/next` - Move to next item (requires password)
   - `POST /api/rooms/:roomId/end-current` - End current item auction (requires password)
   - `POST /api/rooms/:roomId/end` - End the entire auction (requires password)

4. **Auction Participation**
   - `POST /api/rooms/:roomId/join` - Join as participant
   - `POST /api/rooms/:roomId/bid` - Place bid on current item

## WebSocket Events (Updated)

1. **Room Events**
   - `room:start` - Auction room started
   - `room:end` - Auction room ended
   - `participant:join` - New participant joined

2. **Item Events**
   - `item:next` - Moving to next item in sequence
   - `item:bid` - New bid placed
   - `item:timeout:warning` - Approaching timeout
   - `item:sold` - Current item sold
   - `item:manually_ended` - Current item auction manually ended by host

## Sequential Auction Logic

1. **Setup Phase**
   - Host creates room and adds multiple items
   - Each item is assigned a position in the sequence
   - Host can reorder items before starting the auction

2. **Auction Start**
   - When the auction starts, the first item (position = 1) becomes active
   - Only one item is active at any time
   - Room tracks the currently active item

3. **Item Progression**
   - When an item is sold (timeout reached after last bid), system automatically moves to the next item
   - Host can manually end current item auction and move to the next
   - Host can manually select the next item to auction

4. **Auction End**
   - Auction ends when all items have been auctioned
   - Host can end the auction early at any time

## User Flows (Updated)

### Host Flow
1. Create new auction room with a name and password
2. Add multiple auction items with minimum prices and timeout settings
3. Set the sequence order of items
4. Get shareable link to send to participants
5. Access host dashboard using room ID and password
6. Start auction at designated time
7. Monitor bids on the current item in real-time
8. Manually end current item auction if desired or let timeout occur
9. Progress through all items in sequence
10. End auction when complete

### Participant Flow
1. Access auction via shared link
2. Enter unique username for the room
3. Wait for auction to start
4. View current item being auctioned
5. Place bids on current item
6. See preview of upcoming items in the sequence
7. Receive real-time updates on bid status
8. Get notification when new item becomes active
9. See summary of all completed items

## Host Controls for Sequential Auction

1. **Pre-Auction**
   - Add items
   - Set sequence order
   - Configure timeout settings
   - Set minimum prices

2. **During Auction**
   - View current item status
   - Monitor bidding in real-time
   - End current item manually
   - Move to next item
   - Pause/resume auction if needed

3. **Post-Auction**
   - View results summary
   - Export resultss