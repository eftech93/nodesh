/**
 * Database connection utilities
 * Multi-database support with NodeSH adapters
 */

import mongoose from 'mongoose';
import Redis from 'ioredis';
import { 
  createMongoDBConnectionFromEnv, 
  createRedisConnectionFromEnv,
  createPostgreSQLConnectionFromEnv,
  createMySQLConnectionFromEnv,
  createNeo4jConnectionFromEnv,
  createDynamoDBConnectionFromEnv,
  getConnectionManager 
} from '@eftech93/nodesh';

// Re-export all database connections
export {
  createMongoDBConnectionFromEnv,
  createRedisConnectionFromEnv,
  createPostgreSQLConnectionFromEnv,
  createMySQLConnectionFromEnv,
  createNeo4jConnectionFromEnv,
  createDynamoDBConnectionFromEnv,
  getConnectionManager,
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nodesh_example';

/**
 * Connect to MongoDB
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  // Register with NodeSH connection manager
  const manager = getConnectionManager();
  const conn = createMongoDBConnectionFromEnv();
  await conn.connect();
  manager.register(conn);

  return mongoose;
}

/**
 * Connect to all configured databases
 */
export async function connectAll(): Promise<void> {
  console.log('[DB] connectAll() starting...');
  console.log('[DB] Environment check:');
  console.log('  - PGHOST:', process.env.PGHOST);
  console.log('  - POSTGRES_HOST:', process.env.POSTGRES_HOST);
  console.log('  - MYSQL_HOST:', process.env.MYSQL_HOST);
  console.log('  - NEO4J_URI:', process.env.NEO4J_URI);
  console.log('  - NEO4J_HOST:', process.env.NEO4J_HOST);
  console.log('  - DYNAMODB_ENDPOINT:', process.env.DYNAMODB_ENDPOINT);
  console.log('  - AWS_REGION:', process.env.AWS_REGION);
  
  const manager = getConnectionManager();
  
  // Connect MongoDB
  try {
    console.log('[DB] Connecting MongoDB...');
    const mongoConn = createMongoDBConnectionFromEnv();
    await mongoConn.connect();
    manager.register(mongoConn);
    console.log('[DB] ✅ MongoDB connected');
  } catch (err) {
    console.warn('[DB] ⚠️ MongoDB:', (err as Error).message);
  }

  // Connect Redis
  try {
    console.log('[DB] Connecting Redis...');
    const redisConn = createRedisConnectionFromEnv();
    await redisConn.connect();
    manager.register(redisConn);
    console.log('[DB] ✅ Redis connected');
  } catch (err) {
    console.warn('[DB] ⚠️ Redis:', (err as Error).message);
  }

  // Connect PostgreSQL (if configured)
  if (process.env.PGHOST || process.env.POSTGRES_HOST) {
    try {
      console.log('[DB] Connecting PostgreSQL...');
      const pgConn = createPostgreSQLConnectionFromEnv();
      await pgConn.connect();
      manager.register(pgConn);
      console.log('[DB] ✅ PostgreSQL connected');
    } catch (err) {
      console.warn('[DB] ⚠️ PostgreSQL:', (err as Error).message);
    }
  } else {
    console.log('[DB] PostgreSQL skipped (no PGHOST or POSTGRES_HOST)');
  }

  // Connect MySQL (if configured)
  if (process.env.MYSQL_HOST) {
    try {
      console.log('[DB] Connecting MySQL...');
      const mysqlConn = createMySQLConnectionFromEnv();
      await mysqlConn.connect();
      manager.register(mysqlConn);
      console.log('[DB] ✅ MySQL connected');
    } catch (err) {
      console.warn('[DB] ⚠️ MySQL:', (err as Error).message);
    }
  } else {
    console.log('[DB] MySQL skipped (no MYSQL_HOST)');
  }

  // Connect Neo4j (if configured)
  if (process.env.NEO4J_URI || process.env.NEO4J_HOST) {
    try {
      console.log('[DB] Connecting Neo4j...');
      const neo4jConn = createNeo4jConnectionFromEnv();
      await neo4jConn.connect();
      manager.register(neo4jConn);
      console.log('[DB] ✅ Neo4j connected');
    } catch (err) {
      console.warn('[DB] ⚠️ Neo4j:', (err as Error).message);
    }
  } else {
    console.log('[DB] Neo4j skipped (no NEO4J_URI or NEO4J_HOST)');
  }

  // Connect DynamoDB (if configured)
  if (process.env.DYNAMODB_ENDPOINT || process.env.AWS_REGION) {
    try {
      console.log('[DB] Connecting DynamoDB...');
      const dynamoConn = createDynamoDBConnectionFromEnv();
      await dynamoConn.connect();
      manager.register(dynamoConn);
      console.log('[DB] ✅ DynamoDB connected');
    } catch (err) {
      console.warn('[DB] ⚠️ DynamoDB:', (err as Error).message);
    }
  } else {
    console.log('[DB] DynamoDB skipped (no DYNAMODB_ENDPOINT or AWS_REGION)');
  }
  
  console.log('[DB] Total registered connections:', manager.getAll().length);
}

/**
 * Disconnect from all databases
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    await mongoose.disconnect();
  }
  
  // Also disconnect from NodeSH manager
  const manager = getConnectionManager();
  await manager.disconnectAll();
}

// Redis client (legacy - consider using createRedisConnectionFromEnv from NodeSH)
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('Redis connection failed, continuing without cache');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
});

redisClient.on('error', (err) => {
  console.warn('Redis error:', err.message);
});

/**
 * Get database stats using NodeSH
 */
export async function getDBStats(): Promise<{
  mongo: { connected: boolean; readyState: number };
  redis: { connected: boolean };
  postgresql?: { connected: boolean };
  mysql?: { connected: boolean };
  neo4j?: { connected: boolean };
  dynamodb?: { connected: boolean };
}> {
  const manager = getConnectionManager();
  const status = manager.getAllStatus();
  
  const stats: ReturnType<typeof getDBStats> extends Promise<infer T> ? T : never = {
    mongo: {
      connected: status.mongodb?.connected || mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
    },
    redis: {
      connected: status.redis?.connected || redisClient.status === 'ready',
    },
  };

  // Add other database statuses if available
  if (status.postgresql) {
    stats.postgresql = { connected: status.postgresql.connected };
  }
  if (status.mysql) {
    stats.mysql = { connected: status.mysql.connected };
  }
  if (status.neo4j) {
    stats.neo4j = { connected: status.neo4j.connected };
  }
  if (status.dynamodb) {
    stats.dynamodb = { connected: status.dynamodb.connected };
  }

  return stats;
}

/**
 * Initialize all database connections
 */
export async function initDB(): Promise<void> {
  const manager = getConnectionManager();
  await manager.autoConnect();
}

/**
 * Quick connect to specific databases
 */
export async function connectPostgres() {
  const pg = createPostgreSQLConnectionFromEnv();
  await pg.connect();
  getConnectionManager().register(pg);
  return pg;
}

export async function connectMySQL() {
  const mysql = createMySQLConnectionFromEnv();
  await mysql.connect();
  getConnectionManager().register(mysql);
  return mysql;
}

export async function connectNeo4j() {
  const neo4j = createNeo4jConnectionFromEnv();
  await neo4j.connect();
  getConnectionManager().register(neo4j);
  return neo4j;
}

export async function connectDynamoDB() {
  const dynamo = createDynamoDBConnectionFromEnv();
  await dynamo.connect();
  getConnectionManager().register(dynamo);
  return dynamo;
}

// Connection getters
export function mongo() { return getConnectionManager().get('mongodb'); }
export function redisConn() { return getConnectionManager().get('redis'); }
export function pg() { return getConnectionManager().get('postgresql'); }
export function mysqlConn() { return getConnectionManager().get('mysql'); }
export function neo4jConn() { return getConnectionManager().get('neo4j'); }
export function dynamo() { return getConnectionManager().get('dynamodb'); }

// Aliases for convenience
export { mongo as getMongo, pg as getPg, dynamo as getDynamo, redisConn as getRedis, mysqlConn as getMysql, neo4jConn as getNeo4j };
