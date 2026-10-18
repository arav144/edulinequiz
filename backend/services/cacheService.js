/**
 * High-performance, zero-dependency in-memory cache service.
 * Supports TTL per key, prefix deletion, and automatic memory cleanup.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.inFlight = new Map(); // Single-flight memoization to prevent cache stampedes / thundering herds
    // Periodically evict expired keys every 60 seconds
    this.cleanupTimer = setInterval(() => this.purgeExpired(), 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref(); // Prevent timer from keeping Node process alive in tests/scripts
    }
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds = 60) {
    const expiry = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiry });
    return value;
  }

  del(key) {
    this.inFlight.delete(key);
    return this.store.delete(key);
  }

  delByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) {
        this.inFlight.delete(key);
      }
    }
  }

  flush() {
    this.store.clear();
    this.inFlight.clear();
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && item.expiry < now) {
        this.store.delete(key);
      }
    }
  }

  // Single-Flight Cache-or-Fetch pattern (Promise memoization)
  async getOrSet(key, fetchFn, ttlSeconds = 60) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // If an identical fetch is already in flight, collapse into the existing Promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    // Wrap the async fetch in a shared in-flight Promise
    const fetchPromise = (async () => {
      try {
        const fresh = await fetchFn();
        if (fresh !== null && fresh !== undefined) {
          this.set(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }
}

// Global singleton cache instance
const cacheService = new MemoryCache();

module.exports = cacheService;
