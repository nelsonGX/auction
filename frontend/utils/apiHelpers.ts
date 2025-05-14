/**
 * Helper functions for API URL management
 */

/**
 * Returns the base URL for API requests
 * Uses NEXT_PUBLIC_API_URL environment variable if available
 * Falls back to current host if not specified
 */
export function getApiBaseUrl(): string {
  // Always return the hardcoded API URL for reliability
  
  return 'http://172.26.208.1:4000';
  
  // Commented out this code as it's not working reliably
  /*
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
    return 'http://172.26.208.1:4000';
  } else {
    // For development, use the hardcoded API URL
    return 'http://172.26.208.1:4000';
  }
  */
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
    return '172.26.208.1:4000';
  } else {
    return '172.26.208.1:4000';
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
  const fullUrl = `${baseUrl}/api${path}`;
  console.log('ApiHelpers: getApiUrl called for endpoint:', endpoint, 'returning:', fullUrl);
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
  const roomId = path.split('/').pop();
  const allParams = { ...params, roomId };
  const queryString = `?${new URLSearchParams(allParams).toString()}`;
  
  return `${protocol}//${host}${wsPath}${queryString}`;
}