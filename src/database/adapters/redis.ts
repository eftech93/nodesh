/**
 * Redis adapter for NodeSH
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus, RedisConfig } from '../types';

interface RedisClient {
  status: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  info(section?: string): Promise<string>;
  ping(): Promise<string>;
  flushall(): Promise<string>;
  on(event: string, callback: (err?: Error) => void): void;
}

/**
 * Lazy load ioredis
 */
async function importRedis(): Promise<new (config: RedisConfig) => RedisClient> {
  try {
    // Try to load from project's node_modules first
    const projectPath = require.resolve('ioredis', { paths: [process.cwd()] });
    const Redis = require(projectPath);
    return Redis as unknown as new (config: RedisConfig) => RedisClient;
  } catch {
    try {
      // Fall back to default resolution
      const Redis = require('ioredis');
      return Redis as unknown as new (config: RedisConfig) => RedisClient;
    } catch {
      throw new Error('ioredis not installed. Run: npm install ioredis');
    }
  }
}

export class RedisAdapter implements DatabaseAdapter {
  name = 'redis';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    // Redis config has host/port or is a URL string
    return 'host' in cfg || 'port' in cfg || 'url' in cfg;
  }

  async connect(config: RedisConfig): Promise<DatabaseConnection> {
    const connection = new RedisConnection(config);
    await connection.connect();
    return connection;
  }
}

export class RedisConnection implements DatabaseConnection {
  id = 'redis';
  type = 'redis';
  isConnected = false;
  
  private config: RedisConfig;
  private client: RedisClient | null = null;

  constructor(config: RedisConfig) {
    this.config = {
      host: 'localhost',
      port: 6379,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.client) {
      this.isConnected = this.client.status === 'ready';
      return;
    }

    const Redis = await importRedis();
    this.client = new Redis(this.config);

    // Handle errors gracefully
    this.client.on('error', (err?: Error) => {
      if (err && err.message !== 'Connection is closed.') {
        console.warn('Redis error:', err.message);
      }
    });

    // Wait for connection or timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Don't reject, just resolve - Redis is optional
        console.warn('Redis connection timeout, continuing without cache');
        resolve();
      }, 5000);

      this.client!.on('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });

      this.client!.on('ready', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  getStatus(): ConnectionStatus {
    if (!this.client) {
      return { connected: false, error: 'Client not initialized' };
    }

    const status = this.client.status;
    return {
      connected: status === 'ready' || status === 'connect',
      readyState: status === 'ready' ? 1 : 0,
      details: { status },
    };
  }

  /**
   * Get Redis client for direct usage
   */
  getClient(): RedisClient | null {
    return this.client;
  }

  /**
   * Get Redis info
   */
  async getInfo(section?: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.info(section);
    } catch (e) {
      return null;
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.ping();
    } catch (e) {
      return null;
    }
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.client || !this.isConnected) return;
    await this.client.flushall();
  }
}

/** Create Redis connection from environment variables */
export function createRedisConnectionFromEnv(): RedisConnection {
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
  };
  return new RedisConnection(config);
}
