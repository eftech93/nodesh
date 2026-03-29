/**
 * Database adapter types and interfaces
 */

/** Supported database types */
export type DatabaseType = 
  | 'mongodb'
  | 'postgresql'
  | 'mysql'
  | 'redis'
  | 'neo4j'
  | 'dynamodb'
  | 'prisma';

export interface DatabaseConnection {
  /** Unique identifier for this connection */
  id: string;
  /** Database type */
  type: string;
  /** Connection status */
  isConnected: boolean;
  /** Connect to database */
  connect(): Promise<void>;
  /** Disconnect from database */
  disconnect(): Promise<void>;
  /** Get connection status */
  getStatus(): ConnectionStatus;
}

export interface ConnectionStatus {
  connected: boolean;
  readyState?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface MongoDBConfig {
  uri: string;
  options?: Record<string, unknown>;
}

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number | null;
}

export interface PrismaConfig {
  /** Path to schema file */
  schemaPath?: string;
  /** Database URL */
  databaseUrl?: string;
}

export interface DrizzleConfig {
  /** Database connection string */
  connectionString: string;
  /** Schema file path */
  schema?: string;
}

export type DatabaseConfig = 
  | { type: 'mongodb'; config: MongoDBConfig }
  | { type: 'redis'; config: RedisConfig }
  | { type: 'prisma'; config: PrismaConfig }
  | { type: 'drizzle'; config: DrizzleConfig }
  | { type: 'custom'; config: Record<string, unknown>; adapter: DatabaseAdapter };

export interface DatabaseAdapter {
  /** Adapter name */
  name: string;
  /** Connect to database */
  connect(config: unknown): Promise<DatabaseConnection>;
  /** Check if this adapter can handle the given config */
  canHandle(config: unknown): boolean;
}

export interface DatabaseManager {
  /** Register a connection */
  register(connection: DatabaseConnection): void;
  /** Get a connection by ID */
  get(id: string): DatabaseConnection | undefined;
  /** Get all connections */
  getAll(): DatabaseConnection[];
  /** Get connections by type */
  getByType(type: string): DatabaseConnection[];
  /** Connect all registered connections */
  connectAll(): Promise<void>;
  /** Disconnect all connections */
  disconnectAll(): Promise<void>;
  /** Get status of all connections */
  getAllStatus(): Record<string, ConnectionStatus>;
}

/** Console context extensions for database */
export interface DatabaseContext {
  /** Connect to all databases */
  connect(): Promise<void>;
  /** Disconnect from all databases */
  disconnect(): Promise<void>;
  /** Get database stats */
  getDBStats(): Promise<Record<string, ConnectionStatus>>;
  /** Database connections by ID */
  [key: string]: unknown;
}
