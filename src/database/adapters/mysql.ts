/**
 * MySQL adapter for NodeSH
 * Supports both mysql2 and mysql packages
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus } from '../types';

interface MySQLConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  socketPath?: string;
  ssl?: boolean | Record<string, unknown>;
  connectionLimit?: number;
  connectTimeout?: number;
  acquireTimeout?: number;
  url?: string; // Connection URL format
}

interface Pool {
  query(sql: string, params?: unknown[]): Promise<[unknown[], unknown]>;
  execute(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
  end(): Promise<void>;
  getConnection(): Promise<Connection>;
}

interface Connection {
  query(sql: string, params?: unknown[]): Promise<[unknown[], unknown]>;
  execute(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
  release(): void;
  destroy(): void;
}

export class MySQLAdapter implements DatabaseAdapter {
  name = 'mysql';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    return 'host' in cfg || 'url' in cfg || 'socketPath' in cfg;
  }

  async connect(config: MySQLConfig): Promise<DatabaseConnection> {
    const connection = new MySQLConnection(config);
    await connection.connect();
    return connection;
  }
}

export class MySQLConnection implements DatabaseConnection {
  id = 'mysql';
  type = 'mysql';
  isConnected = false;

  private config: MySQLConfig;
  private pool: Pool | null = null;

  constructor(config: MySQLConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.pool) {
      this.isConnected = true;
      return;
    }

    try {
      const mysql = await importMysql();
      
      // Parse URL if provided
      let config = { ...this.config };
      if (this.config.url) {
        const parsed = parseMySQLUrl(this.config.url);
        config = { ...parsed, ...config };
      }

      this.pool = mysql.createPool({
        host: config.host || 'localhost',
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        password: config.password,
        socketPath: config.socketPath,
        ssl: config.ssl,
        connectionLimit: config.connectionLimit || 10,
        connectTimeout: config.connectTimeout || 10000,
        acquireTimeout: config.acquireTimeout || 60000,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      // Test connection
      await this.pool.query('SELECT 1');
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Failed to connect to MySQL: ${(err as Error).message}`);
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
    return {
      connected: this.isConnected,
      details: {
        host: this.config.host || 'localhost',
        database: this.config.database,
      },
    };
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    if (!this.pool) {
      throw new Error('MySQL not connected');
    }
    const [rows] = await this.pool.query(sql, params);
    return rows as unknown[];
  }

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params?: unknown[]): Promise<{
    affectedRows: number;
    insertId?: number | bigint;
  }> {
    if (!this.pool) {
      throw new Error('MySQL not connected');
    }
    const [result] = await this.pool.execute(sql, params);
    const res = result as { affectedRows: number; insertId: number | bigint };
    return {
      affectedRows: res.affectedRows,
      insertId: res.insertId,
    };
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<Connection> {
    if (!this.pool) {
      throw new Error('MySQL not connected');
    }
    return this.pool.getConnection();
  }

  /**
   * Get table names
   */
  async getTables(): Promise<string[]> {
    const rows = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    return (rows as { table_name: string }[]).map(r => r.table_name);
  }

  /**
   * Get database version
   */
  async getVersion(): Promise<string | null> {
    try {
      const rows = await this.query('SELECT VERSION() as version');
      return (rows[0] as { version: string })?.version || null;
    } catch {
      return null;
    }
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
      const [tables, version] = await Promise.all([
        this.getTables(),
        this.getVersion(),
      ]);

      return {
        database: this.config.database || 'unknown',
        tables: tables.length,
        version: version || 'unknown',
      };
    } catch {
      return null;
    }
  }
}

async function importMysql(): Promise<{
  createPool: (config: unknown) => Pool;
}> {
  try {
    // Try to load from project's node_modules first
    const projectPath = require.resolve('mysql2/promise', { paths: [process.cwd()] });
    return require(projectPath);
  } catch {
    try {
      // Fall back to default resolution
      return require('mysql2/promise');
    } catch {
      try {
        // Try mysql2 without promise wrapper
        const projectPath = require.resolve('mysql2', { paths: [process.cwd()] });
        return require(projectPath);
      } catch {
        try {
          return require('mysql2');
        } catch {
          throw new Error('mysql2 not installed. Run: npm install mysql2');
        }
      }
    }
  }
}

function parseMySQLUrl(url: string): Partial<MySQLConfig> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : undefined,
      database: parsed.pathname.replace(/^\//, ''),
      user: parsed.username,
      password: parsed.password,
    };
  } catch {
    return {};
  }
}

/** Create MySQL connection from environment variables */
export function createMySQLConnectionFromEnv(): MySQLConnection {
  const config: MySQLConfig = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    url: process.env.MYSQL_URL || process.env.DATABASE_URL,
  };
  return new MySQLConnection(config);
}
