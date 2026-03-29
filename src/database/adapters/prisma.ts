/**
 * Prisma adapter for NodeSH
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus, PrismaConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClient = any;

export class PrismaAdapter implements DatabaseAdapter {
  name = 'prisma';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    // Prisma config has schema path or database URL
    return 'schemaPath' in cfg || 'databaseUrl' in cfg;
  }

  async connect(config: PrismaConfig): Promise<DatabaseConnection> {
    const connection = new PrismaConnection(config);
    await connection.connect();
    return connection;
  }
}

export class PrismaConnection implements DatabaseConnection {
  id = 'prisma';
  type = 'prisma';
  isConnected = false;
  
  private config: PrismaConfig;
  private client: PrismaClient | null = null;

  constructor(config: PrismaConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.client) {
      this.isConnected = true;
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client');
      this.client = new PrismaClient();
      
      // Test connection
      await this.client.$connect();
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Failed to connect to Prisma: ${(err as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.isConnected = false;
    }
  }

  getStatus(): ConnectionStatus {
    if (!this.client) {
      return { connected: false, error: 'Prisma client not initialized' };
    }

    return {
      connected: this.isConnected,
      details: {
        databaseUrl: this.config.databaseUrl ? '[configured]' : '[not set]',
      },
    };
  }

  /**
   * Get Prisma client for direct usage
   */
  getClient(): PrismaClient | null {
    return this.client;
  }

  /**
   * Execute a raw query
   */
  async executeRaw(query: string): Promise<unknown> {
    if (!this.client) throw new Error('Prisma client not connected');
    return this.client.$executeRawUnsafe(query);
  }

  /**
   * Query raw SQL
   */
  async queryRaw(query: string): Promise<unknown> {
    if (!this.client) throw new Error('Prisma client not connected');
    return this.client.$queryRawUnsafe(query);
  }
}

/** Create Prisma connection from environment variables */
export function createPrismaConnectionFromEnv(): PrismaConnection {
  const config: PrismaConfig = {
    databaseUrl: process.env.DATABASE_URL,
  };
  return new PrismaConnection(config);
}
