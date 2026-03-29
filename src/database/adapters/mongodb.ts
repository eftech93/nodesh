/**
 * MongoDB/Mongoose adapter for NodeSH
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus, MongoDBConfig } from '../types';

interface MongooseInstance {
  connect(uri: string, options?: Record<string, unknown>): Promise<typeof mongoose>;
  disconnect(): Promise<void>;
  connection: {
    readyState: number;
    db?: {
      databaseName: string;
      listCollections(): { toArray(): Promise<{ name: string }[]> };
    };
  };
}

let mongoose: MongooseInstance | null = null;

/**
 * Lazy load mongoose instance
 * Tries to resolve from project first, then from library
 */
function loadMongoose(): MongooseInstance {
  if (!mongoose) {
    try {
      // Try to load from project's node_modules first
      const projectPath = require.resolve('mongoose', { paths: [process.cwd()] });
      mongoose = require(projectPath) as MongooseInstance;
    } catch {
      try {
        // Fall back to default resolution
        mongoose = require('mongoose') as MongooseInstance;
      } catch {
        throw new Error('Mongoose not installed. Run: npm install mongoose');
      }
    }
  }
  return mongoose;
}

export class MongoDBAdapter implements DatabaseAdapter {
  name = 'mongodb';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    return 'uri' in cfg && typeof cfg.uri === 'string';
  }

  async connect(config: MongoDBConfig): Promise<DatabaseConnection> {
    // Ensure mongoose is loaded
    loadMongoose();

    const connection = new MongoDBConnection(config.uri, config.options);
    await connection.connect();
    return connection;
  }
}

export class MongoDBConnection implements DatabaseConnection {
  id = 'mongodb';
  type = 'mongodb';
  isConnected = false;
  
  private uri: string;
  private options?: Record<string, unknown>;

  constructor(uri: string, options?: Record<string, unknown>) {
    this.uri = uri;
    this.options = options;
  }

  async connect(): Promise<void> {
    // Ensure mongoose is loaded before connecting
    const mg = loadMongoose();

    if (mg.connection.readyState >= 1) {
      this.isConnected = true;
      return;
    }

    await mg.connect(this.uri, this.options);
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    const mg = loadMongoose();
    
    if (mg.connection.readyState >= 1) {
      await mg.disconnect();
    }
    this.isConnected = false;
  }

  getStatus(): ConnectionStatus {
    try {
      const mg = loadMongoose();
      const readyState = mg.connection.readyState;
      const stateNames: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      return {
        connected: readyState === 1,
        readyState,
        details: {
          state: stateNames[readyState] || 'unknown',
          database: mg.connection.db?.databaseName,
        },
      };
    } catch {
      return { connected: false, error: 'Mongoose not loaded' };
    }
  }

  /**
   * Get mongoose instance (for advanced usage)
   */
  getMongoose(): MongooseInstance | null {
    try {
      return loadMongoose();
    } catch {
      return null;
    }
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    collections: string[];
    databaseName?: string;
  } | null> {
    try {
      const mg = loadMongoose();
      if (!mg.connection.db) return null;

      const collections = await mg.connection.db.listCollections().toArray();
      return {
        collections: collections.map(c => c.name),
        databaseName: mg.connection.db.databaseName,
      };
    } catch {
      return null;
    }
  }
}

/** Create MongoDB connection from environment variables */
export function createMongoDBConnectionFromEnv(): MongoDBConnection {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/default';
  return new MongoDBConnection(uri);
}
