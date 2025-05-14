/**
 * Debugging utilities for the auction app
 */

/**
 * Tests localStorage functionality in the current browser environment
 * @returns Boolean indicating if localStorage is working properly
 */
export function testLocalStorage(): boolean {
  try {
    const testKey = `test_${Date.now()}`;
    const testValue = `test_${Math.random()}`;
    
    // Try to write to localStorage
    localStorage.setItem(testKey, testValue);
    
    // Try to read from localStorage
    const retrievedValue = localStorage.getItem(testKey);
    
    // Cleanup
    localStorage.removeItem(testKey);
    
    // Check if the value was correctly stored and retrieved
    return retrievedValue === testValue;
  } catch (error) {
    console.error('localStorage test failed:', error);
    return false;
  }
}

/**
 * Manually sets host authentication in localStorage
 * This can be used as a workaround when the normal authentication flow fails
 * @param roomId The room ID
 * @param hostId The host participant ID
 * @returns Boolean indicating if the operation was successful
 */
export function setHostAuthentication(roomId: string, hostId: string): boolean {
  try {
    console.log(`Setting manual authentication for room ${roomId} with hostId ${hostId}`);
    
    const authState = {
      authenticated: true,
      id: hostId,
    };
    
    localStorage.setItem(`host_auth_${roomId}`, JSON.stringify(authState));
    
    // Verify the data was stored correctly
    const storedData = localStorage.getItem(`host_auth_${roomId}`);
    if (!storedData) {
      console.error('Failed to verify localStorage data - item not found');
      return false;
    }
    
    const parsedData = JSON.parse(storedData);
    if (!parsedData.authenticated || parsedData.id !== hostId) {
      console.error('Failed to verify localStorage data - content mismatch');
      return false;
    }
    
    console.log('Manual authentication set successfully');
    return true;
  } catch (error) {
    console.error('Failed to set manual authentication:', error);
    return false;
  }
}

/**
 * Clears host authentication from localStorage
 * @param roomId The room ID
 * @returns Boolean indicating if the operation was successful
 */
export function clearHostAuthentication(roomId: string): boolean {
  try {
    localStorage.removeItem(`host_auth_${roomId}`);
    return true;
  } catch (error) {
    console.error('Failed to clear authentication:', error);
    return false;
  }
}

/**
 * Displays the current authentication state in the console
 * @param roomId The room ID
 */
export function debugAuthState(roomId: string): void {
  try {
    const storedAuthState = localStorage.getItem(`host_auth_${roomId}`);
    console.log('Current auth state for room', roomId, ':', storedAuthState);
    
    if (storedAuthState) {
      try {
        const parsed = JSON.parse(storedAuthState);
        console.log('Parsed auth state:', parsed);
      } catch (err) {
        console.error('Failed to parse auth state JSON:', err);
      }
    }
  } catch (error) {
    console.error('Failed to debug auth state:', error);
  }
}