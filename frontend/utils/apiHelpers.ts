/**
 * Helper functions for API URL management
 */

/**
 * Returns the base URL for API requests
 * Uses NEXT_PUBLIC_API_URL environment variable if available
 * Falls back to current host if not specified
 */
export function getApiBaseUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    // Check if it already has a protocol
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      return apiUrl;
    }
    // Add protocol if missing
    return `http://${apiUrl}`;
  }
  
  // Fall back to current host
  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  } else {
    return `${window.location.protocol}//${window.location.host}`;
  }
}

/**
 * Returns the WebSocket URL for realtime connections
 * Uses NEXT_PUBLIC_WS_URL environment variable if available
 * Falls back to current host if not specified
 */
export function getWsUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_WS_URL) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    // Strip any protocol if present
    if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://') || 
        wsUrl.startsWith('http://') || wsUrl.startsWith('https://')) {
      return wsUrl.replace(/^(ws|wss|http|https):\/\//, '');
    }
    return wsUrl;
  }
  
  // Fall back to current host
  if (typeof window === 'undefined') {
    return 'localhost:4000';
  } else {
    return window.location.host;
  }
}

/**
 * Constructs a fully qualified API endpoint URL
 * @param endpoint - The API endpoint (e.g., '/rooms/123')
 * @returns The full URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api${path}`;
}

/**
 * Constructs a fully qualified WebSocket URL
 * @param path - The WebSocket path (e.g., '/rooms/123')
 * @param params - Optional query parameters
 * @returns The full WebSocket URL
 */
export function getWsFullUrl(path: string, params: Record<string, string> = {}): string {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = getWsUrl();
  const wsPath = path.startsWith('/') ? path : `/${path}`;
  
  // Add query parameters if any
  const queryString = Object.keys(params).length > 0 
    ? `?${new URLSearchParams(params).toString()}`
    : '';
  
  return `${protocol}//${host}${wsPath}${queryString}`;
}