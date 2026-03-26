/**
 * Cache Service - Redis cache operations
 */
const { redis, getCache, setCache, deleteCache, clearPattern } = require('../config/redis');

class CacheService {
  /**
   * Get value from cache
   */
  async get(key) {
    return getCache(key);
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttlSeconds = 3600) {
    return setCache(key, value, ttlSeconds);
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    return deleteCache(key);
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern) {
    return clearPattern(pattern);
  }

  /**
   * Get all cache keys matching pattern
   */
  async getKeys(pattern = '*') {
    const keys = await redis.keys(pattern);
    return keys;
  }

  /**
   * Get cache info
   */
  async getInfo() {
    const info = await redis.info();
    return this.parseInfo(info);
  }

  /**
   * Get cache stats
   */
  async getStats() {
    const dbSize = await redis.dbsize();
    const info = await this.getInfo();
    
    return {
      keyCount: dbSize,
      usedMemory: info.used_memory_human,
      totalConnections: info.total_connections_received,
      totalCommands: info.total_commands_processed,
      uptime: info.uptime_in_seconds
    };
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll() {
    await redis.flushall();
    return true;
  }

  /**
   * Get TTL of a key
   */
  async getTTL(key) {
    return redis.ttl(key);
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const result = await redis.exists(key);
    return result === 1;
  }

  /**
   * Parse Redis INFO response
   */
  parseInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Cache user data
   */
  async cacheUser(userId, userData, ttl = 3600) {
    return this.set(`user:${userId}`, userData, ttl);
  }

  /**
   * Get cached user
   */
  async getCachedUser(userId) {
    return this.get(`user:${userId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId) {
    return this.delete(`user:${userId}`);
  }

  /**
   * Cache product data
   */
  async cacheProduct(productId, productData, ttl = 1800) {
    return this.set(`product:${productId}`, productData, ttl);
  }

  /**
   * Get cached product
   */
  async getCachedProduct(productId) {
    return this.get(`product:${productId}`);
  }

  /**
   * Invalidate all product caches
   */
  async invalidateAllProducts() {
    return this.clearPattern('product:*');
  }
}

module.exports = new CacheService();
