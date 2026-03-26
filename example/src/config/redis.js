/**
 * Redis Configuration
 */
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// Cache helper functions
async function getCache(key) {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function setCache(key, value, ttlSeconds = 3600) {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

async function deleteCache(key) {
  await redis.del(key);
}

async function clearPattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

module.exports = {
  redis,
  getCache,
  setCache,
  deleteCache,
  clearPattern
};
