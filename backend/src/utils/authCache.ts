/**
 * Simple memory cache for authentication to work around session issues
 */

type AuthEntry = {
  hostId: string;
  expires: number;
};

class AuthCache {
  private cache: Map<string, AuthEntry> = new Map();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Store host authentication for a room
  setHostAuth(roomId: string, hostId: string) {
    this.cache.set(roomId, {
      hostId,
      expires: Date.now() + this.TTL
    });
  }

  // Get host ID for a room if available and not expired
  getHostId(roomId: string): string | null {
    const entry = this.cache.get(roomId);
    
    // No entry found
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (entry.expires < Date.now()) {
      this.cache.delete(roomId);
      return null;
    }
    
    // Return valid host ID
    return entry.hostId;
  }

  // Clear a specific entry
  clearHostAuth(roomId: string) {
    this.cache.delete(roomId);
  }

  // Clean up expired entries (can be called periodically)
  cleanup() {
    const now = Date.now();
    for (const [roomId, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(roomId);
      }
    }
  }
}

// Create a singleton instance
const authCache = new AuthCache();

export default authCache;