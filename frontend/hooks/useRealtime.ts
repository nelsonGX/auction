import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketEvent } from '../lib/types';
import { getApiBaseUrl } from '../utils/apiHelpers';
import { io, Socket } from 'socket.io-client';

// Store sockets in a global cache to prevent recreation
const socketCache = new Map<string, Socket>();

interface UseRealtimeOptions {
  roomId: string;
  participantId?: string;
  onEvent?: (event: WebSocketEvent, eventName: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export default function useRealtime({
  roomId,
  participantId,
  onEvent,
  onConnected,
  onDisconnected,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listenerSetupRef = useRef(false);
  
  // Generate a cache key for this socket
  const getCacheKey = useCallback(() => {
    return `room:${roomId}${participantId ? `:participant:${participantId}` : ''}`;
  }, [roomId, participantId]);

  // Setup event listeners without recreating the socket
  const setupEventListeners = useCallback((socket: Socket) => {
    if (listenerSetupRef.current) return;
    
    // Set up event listeners for auction events
    const eventTypes = [
      'room:start', 'room:end', 'participant:join',
      'item:next', 'item:bid', 'item:timeout:warning',
      'item:sold', 'item:manually_ended'
    ];
    
    // Clear existing listeners first
    eventTypes.forEach(eventType => {
      socket.off(eventType);
    });
    
    // Add new listeners
    eventTypes.forEach(eventType => {
      socket.on(eventType, (data) => {
        console.log(`Received Socket.IO event: ${eventType} for room ${roomId}`, data);
        // Sanity check data to report incomplete events
        if (!data) {
          console.warn(`Event ${eventType} received with no data payload`);
        }
        
        // Log important data structure issues
        if (eventType === 'room:start' && !data.room) {
          console.warn(`room:start event missing room data`);
        }
        
        if (eventType === 'item:next' && !data.item) {
          console.warn(`item:next event missing item data`);
        }
        
        if (eventType === 'item:bid' && (!data.bid || !data.item)) {
          console.warn(`item:bid event missing data: ${!data.bid ? 'bid' : ''} ${!data.item ? 'item' : ''}`);
        }
        
        // Forward the event to handler
        onEvent?.(data, eventType);
      });
    });
    
    // Update connection status handlers
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    
    socket.on('connect', () => {
      console.log(`Socket.IO connected (${socket.id}) for room ${roomId}`);
      setIsConnected(true);
      setError(null);
      onConnected?.();
      
      // Verify we've joined the room
      socket.emit('verify-room', { roomId }, (response: unknown) => {
        console.log(`Room verification response: ${JSON.stringify(response)}`);
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected from room ${roomId}:`, reason);
      setIsConnected(false);
      onDisconnected?.();
    });

    socket.on('connect_error', (err) => {
      console.error(`Socket.IO connection error for room ${roomId}:`, err);
      setError('Failed to connect to real-time service');
    });
    
    listenerSetupRef.current = true;
  }, [roomId, onEvent, onConnected, onDisconnected]);

  // Get or create a Socket.IO connection
  const getOrCreateSocket = useCallback(() => {
    if (!roomId) return null;
    
    const cacheKey = getCacheKey();
    
    // Check if we already have a socket for this room/participant
    if (socketCache.has(cacheKey)) {
      const socket = socketCache.get(cacheKey)!;
      
      // If socket is disconnected, reconnect it
      if (!socket.connected) {
        console.log('Reconnecting existing cached socket');
        socket.connect();
      }
      
      return socket;
    }
    
    // Create a new socket if none exists
    try {
      const baseUrl = getApiBaseUrl();
      console.log('Creating new Socket.IO connection:', baseUrl, cacheKey);
      
      const socket = io(baseUrl, {
        path: '/ws',
        query: {
          roomId,
          ...(participantId ? { participantId } : {})
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
      });
      
      // Add to cache
      socketCache.set(cacheKey, socket);
      return socket;
    } catch (err) {
      console.error('Failed to create Socket.IO connection:', err);
      setError('Failed to connect to real-time service');
      return null;
    }
  }, [roomId, participantId, getCacheKey]);

  // Send a message through Socket.IO
  const send = useCallback((event: string, message: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, message);
      return true;
    }
    return false;
  }, []);

  // Initialize and manage socket connection
  useEffect(() => {
    // Get or create the socket
    const socket = getOrCreateSocket();
    if (!socket) return;
    
    // Store the socket in ref
    socketRef.current = socket;
    
    // Set up event listeners
    setupEventListeners(socket);
    
    // Update connected state
    setIsConnected(socket.connected);
    
    // Cleanup function
    return () => {
      listenerSetupRef.current = false;
      
      // We don't disconnect the socket here since it's cached
      // Just remove this component's specific listeners
      if (socketRef.current) {
        const eventTypes = [
          'room:start', 'room:end', 'participant:join',
          'item:next', 'item:bid', 'item:timeout:warning',
          'item:sold', 'item:manually_ended'
        ];
        
        eventTypes.forEach(eventType => {
          socketRef.current?.off(eventType);
        });
        
        socketRef.current?.off('connect');
        socketRef.current?.off('disconnect');
        socketRef.current?.off('connect_error');
      }
    };
  }, [roomId, participantId, getOrCreateSocket, setupEventListeners]);

  return { isConnected, error, send };
}