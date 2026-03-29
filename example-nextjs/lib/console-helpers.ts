/**
 * NodeSH Console Helpers for Next.js Example
 * Example-specific utilities that build on top of NodeSH's core helpers
 * 
 * All exports from this file are automatically available in the NodeSH console
 */

import { 
  run, 
  batch, 
  api,
  apiHttp,
  nextApi,
  callNextRoute, 
  importServerActions,
  execAction,
  http,
  nextFetch,
  debugApi,
  createNextAppRouterRequest,
  seedUsers as seedUsersFromLib,
} from '@eftech93/nodesh';

// Re-export from library for convenience
export {
  run,
  batch,
  api,
  apiHttp,
  nextApi,
  callNextRoute,
  importServerActions,
  execAction,
  http,
  nextFetch,
  debugApi,
  createNextAppRouterRequest,
  seedUsersFromLib as seedUsers,
};

// Re-export with example-specific names for backward compatibility
export { run as exec };

// Lazy load db module to avoid circular deps
async function getDb() {
  return import('./db');
}

// Example-specific: Pre-configured API caller for this example's structure
export const exampleApi = (path: string, method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: Record<string, unknown>, options?: { query?: Record<string, string>; headers?: Record<string, string> }) =>
  api('./src/app/api', path, method, body, options);

// Example-specific: Pre-configured HTTP methods for this example
export const exampleHttp = apiHttp('./src/app/api');

/**
 * Example-specific: Ensure DB is connected before operations
 */
let isConnected = false;
export async function ensureConnected(): Promise<void> {
  if (!isConnected) {
    const { connectAll } = await getDb();
    await connectAll();
    isConnected = true;
  }
}

/**
 * Example-specific: Connect to all configured databases
 */
export async function connect(): Promise<void> {
  const { connectAll } = await getDb();
  await connectAll();
  isConnected = true;
}

/**
 * Get database connections from the connection manager
 */
export function getConnections() {
  // Import dynamically to avoid loading issues
  const { getConnectionManager } = require('@eftech93/nodesh');
  const manager = getConnectionManager();
  return {
    mongo: manager.get('mongodb'),
    redis: manager.get('redis'),
    pg: manager.get('postgresql'),
    mysql: manager.get('mysql'),
    neo4j: manager.get('neo4j'),
    dynamo: manager.get('dynamodb'),
  };
}

// Export individual connection getters - these return the connection from the manager
export function mongo() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('mongodb'); 
}
export function redisConn() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('redis'); 
}
export function pg() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('postgresql'); 
}
export function mysqlConn() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('mysql'); 
}
export function neo4jConn() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('neo4j'); 
}
export function dynamo() { 
  const { getConnectionManager } = require('@eftech93/nodesh');
  return getConnectionManager().get('dynamodb'); 
}

// Aliases for convenience
export { mongo as getMongo, pg as getPg, dynamo as getDynamo, redisConn as getRedis, mysqlConn as getMysql, neo4jConn as getNeo4j };

/**
 * Example-specific: Seed database with sample users
 */
export async function seed(count = 10): Promise<void> {
  const { UserService } = await import('../src/services/UserService');
  
  await connect();
  
  await run(async () => {
    console.log(`🌱 Seeding ${count} users...`);
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
    
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      try {
        await UserService.create({
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          password: 'password123',
          name: { first: firstName, last: lastName },
          role: i === 0 ? 'admin' : 'user',
        });
      } catch (e) {
        // Skip duplicates
      }
    }
    
    return `${count} users created`;
  }, 'Seed users');
}

/**
 * Example-specific: Clear all data
 */
export async function clear(): Promise<void> {
  const { User } = await import('../src/models/User');
  
  await connect();
  
  console.log('🧹 Clearing database...');
  await User.deleteMany({});
  
  console.log('🧹 Clearing cache...');
  try {
    const { redisClient } = await getDb();
    await redisClient.flushall();
  } catch (e) {
    // Redis might not be available
  }
  
  console.log('✅ Cleared');
}

/**
 * Example-specific: Show current database stats
 */
export async function stats(): Promise<void> {
  const { UserService } = await import('../src/services/UserService');
  const { getDBStats } = await getDb();
  
  const [userStats, dbStats] = await Promise.all([
    UserService.getStats(),
    getDBStats(),
  ]);
  
  console.log('\n📊 Database Stats:');
  console.log('  Users:', userStats);
  console.log('  DB Connection:', dbStats);
  
  // Redis info
  try {
    const { redisClient } = await getDb();
    const redisInfo = await redisClient.info('server');
    const version = redisInfo.match(/redis_version:(.+)/)?.[1]?.trim();
    console.log('  Redis Version:', version || 'unknown');
  } catch (e) {
    console.log('  Redis: not connected');
  }
}

/**
 * Example-specific: Interactive debugger for API routes
 */
export async function debugExampleApi(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<void> {
  console.log(`\n🔍 Debugging API: ${method} ${path}`);
  console.log('Step 1: Creating request...');
  
  const request = createNextAppRouterRequest(`http://localhost:3000${path}`, {
    method,
    body,
  });
  
  console.log('Request:', {
    url: request.url,
    method: request.method,
  });
  
  if (body) {
    console.log('Body:', body);
  }
  
  console.log('\nStep 2: Calling handler...');
  const result = await exampleApi(path, method, body);
  
  console.log('\nStep 3: Response received:');
  console.log('Status:', result.status);
  console.log('Headers:', result.headers);
  console.log('Data:', result.data);
}
