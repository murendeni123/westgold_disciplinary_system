/**
 * Simple in-process TTL cache for frequently accessed, rarely-changing data.
 * Reduces repeated database round-trips for school info, plan limits,
 * and other configuration that doesn't change mid-session.
 *
 * NOT suitable for multi-instance deployments without Redis.
 * For multi-instance, swap the Map for a Redis client here.
 */

const store = new Map();

/**
 * Retrieve a cached value. Returns null if missing or expired.
 * @param {string} key
 * @returns {any|null}
 */
const get = (key) => {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.value;
};

/**
 * Store a value with a TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlMs=60000]  milliseconds until expiry (default 60 s)
 */
const set = (key, value, ttlMs = 60000) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

/**
 * Delete one key explicitly (e.g. after a write operation).
 * @param {string} key
 */
const del = (key) => {
    store.delete(key);
};

/**
 * Delete all keys that start with a given prefix.
 * Useful for invalidating all cache entries for a school.
 * @param {string} prefix
 */
const invalidatePrefix = (prefix) => {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
};

/**
 * Return current cache size (for health/debug endpoints).
 */
const size = () => store.size;

// Periodically sweep expired entries to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.expiresAt) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000); // sweep every 5 minutes

module.exports = { get, set, del, invalidatePrefix, size };
