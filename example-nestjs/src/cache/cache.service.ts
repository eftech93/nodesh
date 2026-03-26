import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getKeys(pattern = '*'): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async getStats(): Promise<any> {
    const dbSize = await this.redis.dbsize();
    const info = await this.redis.info();
    
    return {
      keyCount: dbSize,
      info: this.parseInfo(info),
    };
  }

  async flushAll(): Promise<void> {
    await this.redis.flushall();
  }

  async getTTL(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  private parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
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

  // Helper methods for specific entities
  async cacheUser(userId: string, userData: any, ttl = 3600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttl);
  }

  async getCachedUser(userId: string): Promise<any> {
    return this.get(`user:${userId}`);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.delete(`user:${userId}`);
  }

  getRedisClient(): Redis {
    return this.redis;
  }
}
