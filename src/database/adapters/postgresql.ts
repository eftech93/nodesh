/**
 * PostgreSQL adapter for NodeSH
 * Uses pg (node-postgres) under the hood
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus } from '../types';

interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean | Record<string, unknown>;
  max?: number; // max pool size
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

interface Pool {
  connect(): Promise<Client>;
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

interface Client {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  release(): void;
}

interface QueryResult {
  rows: unknown[];
  rowCount: number | null;
  command: string;
}

export class PostgreSQLAdapter implements DatabaseAdapter {
  name = 'postgresql';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    return 'host' in cfg || 'connectionString' in cfg || 'database' in cfg;
  }

  async connect(config: PostgresConfig): Promise<DatabaseConnection> {
    const connection = new PostgreSQLConnection(config);
    await connection.connect();
    return connection;
  }
}

export class PostgreSQLConnection implements DatabaseConnection {
  id = 'postgresql';
  type = 'postgresql';
  isConnected = false;

  private config: PostgresConfig;
  private pool: Pool | null = null;

  constructor(config: PostgresConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.pool) {
      this.isConnected = true;
      return;
    }

    try {
      const { Pool } = await importPg();
      
      const poolConfig = this.config.connectionString
        ? { connectionString: this.config.connectionString }
        : {
            host: this.config.host || 'localhost',
            port: this.config.port || 5432,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl,
            max: this.config.max || 20,
            idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: this.config.connectionTimeoutMillis || 2000,
          };

      this.pool = new Pool(poolConfig);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Failed to connect to PostgreSQL: ${(err as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }

  getStatus(): ConnectionStatus {
    if (!this.pool) {
      return { connected: false, error: 'Pool not initialized' };
    }

    return {
      connected: this.isConnected,
      details: {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingConnections: this.pool.waitingCount,
      },
    };
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected');
    }
    return this.pool.query(sql, params);
  }

  /**
   * Get a client from the pool (for transactions)
   */
  async getClient(): Promise<Client> {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected');
    }
    return this.pool.connect();
  }

  /**
   * Get table names
   */
  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return (result.rows as Array<{ table_name: string }>).map(r => r.table_name);
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    database: string;
    tables: number;
    version: string;
  } | null> {
    try {
      const versionResult = await this.query('SELECT version() as v');
      const tableResult = await this.query(`
        SELECT COUNT(*) as c
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const versionRow = versionResult.rows[0] as { v: string } | undefined;
      const tableRow = tableResult.rows[0] as { c: string } | undefined;

      return {
        database: this.config.database || 'unknown',
        tables: parseInt(tableRow?.c || '0'),
        version: versionRow?.v?.split(' ')[1] || 'unknown',
      };
    } catch {
      return null;
    }
  }
}

async function importPg(): Promise<{ Pool: new (config: unknown) => Pool }> {
  try {
    // Try to load from project's node_modules first
    const projectPath = require.resolve('pg', { paths: [process.cwd()] });
    const pg = require(projectPath);
    return pg;
  } catch {
    try {
      // Fall back to default resolution
      const pg = require('pg');
      return pg;
    } catch {
      throw new Error('pg not installed. Run: npm install pg');
    }
  }
}

/** Create PostgreSQL connection from environment variables */
export function createPostgreSQLConnectionFromEnv(): PostgreSQLConnection {
  const config: PostgresConfig = {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432'),
    database: process.env.PGDATABASE || process.env.DB_NAME,
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
  return new PostgreSQLConnection(config);
}
