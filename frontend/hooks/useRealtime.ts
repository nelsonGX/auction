import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketEvent } from '../lib/types';

interface UseRealtimeOptions {
  roomId: string;
  participantId?: string;
  onEvent?: (event: WebSocketEvent) => void;
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
  const wsRef = useRef<WebSocket | null>(null);

  // Create WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // For development environment, adapt the URL based on your server setup
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
      const wsUrl = `${protocol}//${host}/ws/rooms/${roomId}${participantId ? `?participantId=${participantId}` : ''}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        onConnected?.();
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnected?.();
        
        // Auto-reconnect after a delay
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Failed to connect to real-time service');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          onEvent?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to real-time service');
    }
  }, [roomId, participantId, onConnected, onDisconnected, onEvent]);

  // Send a message through the WebSocket
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Reconnect if roomId or participantId changes
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      connect();
    }
  }, [roomId, participantId, connect]);

  return { isConnected, error, send };
}