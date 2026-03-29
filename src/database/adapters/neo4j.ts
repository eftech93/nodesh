/**
 * Neo4j Graph Database adapter for NodeSH
 * Uses the official neo4j-driver
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus } from '../types';

interface Neo4jConfig {
  uri?: string;
  url?: string;
  host?: string;
  port?: number;
  scheme?: 'bolt' | 'neo4j' | 'bolt+s' | 'neo4j+s';
  username?: string;
  user?: string;
  password?: string;
  database?: string;
  encrypted?: boolean;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
}

interface Driver {
  session(config?: { database?: string; defaultAccessMode?: string }): Session;
  verifyConnectivity(): Promise<ServerInfo>;
  close(): Promise<void>;
}

interface Session {
  run(query: string, params?: Record<string, unknown>): Promise<Result>;
  close(): Promise<void>;
}

interface Result {
  records: Neo4jRecord[];
  summary: Summary;
}

interface Neo4jRecord {
  keys: string[];
  length: number;
  get(key: string): unknown;
  toObject(): Record<string, unknown>;
}

interface Summary {
  counters: {
    nodesCreated: number;
    nodesDeleted: number;
    relationshipsCreated: number;
    relationshipsDeleted: number;
    propertiesSet: number;
    labelsAdded: number;
    labelsRemoved: number;
    indexesAdded: number;
    indexesRemoved: number;
    constraintsAdded: number;
    constraintsRemoved: number;
  };
  query: { text: string; parameters: Record<string, unknown> };
  queryType: string;
}

interface ServerInfo {
  address: string;
  protocolVersion: number;
  agent: string;
}

interface Neo4jAuth {
  basic(username: string, password: string): unknown;
}

export class Neo4jAdapter implements DatabaseAdapter {
  name = 'neo4j';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    return 'uri' in cfg || 'url' in cfg || 'host' in cfg;
  }

  async connect(config: Neo4jConfig): Promise<DatabaseConnection> {
    const connection = new Neo4jConnection(config);
    await connection.connect();
    return connection;
  }
}

export class Neo4jConnection implements DatabaseConnection {
  id = 'neo4j';
  type = 'neo4j';
  isConnected = false;

  private config: Neo4jConfig;
  private driver: Driver | null = null;
  private serverInfo: ServerInfo | null = null;

  constructor(config: Neo4jConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.driver) {
      this.isConnected = true;
      return;
    }

    try {
      const neo4j = await importNeo4j();
      
      // Build URI
      let uri = this.config.uri || this.config.url;
      if (!uri) {
        const scheme = this.config.scheme || 'bolt';
        const host = this.config.host || 'localhost';
        const port = this.config.port || 7687;
        uri = `${scheme}://${host}:${port}`;
      }

      const username = this.config.username || this.config.user || 'neo4j';
      const password = this.config.password || '';

      const auth = neo4j.auth.basic(username, password);
      
      // Determine encryption setting
      // Default to false for local development (bolt://localhost)
      // Only enable if explicitly set to true or using neo4j+s/bolt+s scheme
      let encrypted = this.config.encrypted;
      if (encrypted === undefined) {
        const isSecureScheme = uri.startsWith('neo4j+s://') || uri.startsWith('bolt+s://');
        const isLocalhost = uri.includes('localhost') || uri.includes('127.0.0.1');
        encrypted = isSecureScheme || !isLocalhost;
      }

      this.driver = neo4j.driver(uri, auth, {
        maxConnectionPoolSize: this.config.maxConnectionPoolSize || 100,
        connectionAcquisitionTimeout: this.config.connectionTimeout || 60000,
        encrypted: encrypted,
      });

      // Verify connectivity
      this.serverInfo = await this.driver.verifyConnectivity();
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Failed to connect to Neo4j: ${(err as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.serverInfo = null;
      this.isConnected = false;
    }
  }

  getStatus(): ConnectionStatus {
    if (!this.driver) {
      return { connected: false, error: 'Driver not initialized' };
    }

    return {
      connected: this.isConnected,
      details: {
        address: this.serverInfo?.address,
        protocolVersion: this.serverInfo?.protocolVersion,
        agent: this.serverInfo?.agent,
        database: this.config.database || 'neo4j',
      },
    };
  }

  /**
   * Run a Cypher query
   */
  async run(
    query: string, 
    params?: Record<string, unknown>
  ): Promise<{
    records: Array<Record<string, unknown>>;
    summary: Summary;
  }> {
    if (!this.driver) {
      throw new Error('Neo4j not connected');
    }

    const session = this.driver.session({
      database: this.config.database,
      defaultAccessMode: 'WRITE',
    });

    try {
      const result = await session.run(query, params);
      
      return {
        records: result.records.map(r => r.toObject()),
        summary: result.summary,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Run a read-only query
   */
  async read(
    query: string, 
    params?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>> {
    if (!this.driver) {
      throw new Error('Neo4j not connected');
    }

    const session = this.driver.session({
      database: this.config.database,
      defaultAccessMode: 'READ',
    });

    try {
      const result = await session.run(query, params);
      return result.records.map(r => r.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Run a write query
   */
  async write(
    query: string, 
    params?: Record<string, unknown>
  ): Promise<{
    records: Array<Record<string, unknown>>;
    counters: Summary['counters'];
  }> {
    if (!this.driver) {
      throw new Error('Neo4j not connected');
    }

    const session = this.driver.session({
      database: this.config.database,
      defaultAccessMode: 'WRITE',
    });

    try {
      const result = await session.run(query, params);
      return {
        records: result.records.map(r => r.toObject()),
        counters: result.summary.counters,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Get node labels
   */
  async getLabels(): Promise<string[]> {
    const result = await this.read('CALL db.labels() YIELD label RETURN label');
    return result.map(r => r.label as string);
  }

  /**
   * Get relationship types
   */
  async getRelationshipTypes(): Promise<string[]> {
    const result = await this.read('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType');
    return result.map(r => r.relationshipType as string);
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    nodes: number;
    relationships: number;
    labels: number;
    relationshipTypes: number;
  } | null> {
    try {
      const [nodeResult, relResult] = await Promise.all([
        this.read('MATCH (n) RETURN count(n) as count'),
        this.read('MATCH ()-[r]->() RETURN count(r) as count'),
      ]);

      const labels = await this.getLabels();
      const types = await this.getRelationshipTypes();

      return {
        nodes: parseInt((nodeResult[0]?.count as string) || '0'),
        relationships: parseInt((relResult[0]?.count as string) || '0'),
        labels: labels.length,
        relationshipTypes: types.length,
      };
    } catch {
      return null;
    }
  }
}

async function importNeo4j(): Promise<{
  driver: (uri: string, authToken: unknown, config?: unknown) => Driver;
  auth: Neo4jAuth;
}> {
  try {
    // Try to load from project's node_modules first
    const projectPath = require.resolve('neo4j-driver', { paths: [process.cwd()] });
    return require(projectPath);
  } catch {
    try {
      // Fall back to default resolution
      return require('neo4j-driver');
    } catch {
      throw new Error('neo4j-driver not installed. Run: npm install neo4j-driver');
    }
  }
}

/** Create Neo4j connection from environment variables */
export function createNeo4jConnectionFromEnv(): Neo4jConnection {
  const config: Neo4jConfig = {
    uri: process.env.NEO4J_URI || process.env.NEO4J_URL,
    host: process.env.NEO4J_HOST || 'localhost',
    port: parseInt(process.env.NEO4J_PORT || '7687'),
    scheme: (process.env.NEO4J_SCHEME as Neo4jConfig['scheme']) || 'bolt',
    username: process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || '',
    database: process.env.NEO4J_DATABASE,
    encrypted: process.env.NEO4J_ENCRYPTED === 'true',
  };
  return new Neo4jConnection(config);
}
