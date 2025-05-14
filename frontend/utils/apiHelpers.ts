/**
 * Returns the base URL for API requests
 * Uses NEXT_PUBLIC_API_URL environment variable if available
 * Falls back to current host if not specified
 */
export function getApiBaseUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Check if it already has a protocol
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      return apiUrl;
    }
    // Add protocol if missing
    return `http://${apiUrl}`;
  }
  
  // Fall back to hardcoded default
  return 'http://localhost:4000';
}

/**
 * Returns the WebSocket URL for realtime connections
 * Uses NEXT_PUBLIC_WS_URL environment variable if available
 * Falls back to hardcoded default if not specified
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
  
  // Fall back to hardcoded default
  return 'localhost:4000';
}

/**
 * Constructs a fully qualified API endpoint URL
 * @param endpoint - The API endpoint (e.g., '/rooms/123')
 * @returns The full URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}/api${path}`;
  
  return fullUrl;
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
  
  // Socket.io expects a specific structure for the WebSocket URL
  const wsPath = '/ws'; // This is the Socket.io path configured on the server
  
  // Add query parameters including roomId extracted from path
  const roomId = path.split('/').pop() || '';
  const allParams = { ...params, roomId };
  const queryString = `?${new URLSearchParams(allParams).toString()}`;
  
  return `${protocol}//${host}${wsPath}${queryString}`;
}