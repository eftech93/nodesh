/**
 * Database module for NodeSH
 * Provides multi-database support with adapters for MongoDB, Redis, Prisma, and more
 */

export * from './types';
export * from './adapters';
export * from './connection-manager';

import { ConnectionManager, getConnectionManager } from './connection-manager';

/**
 * Initialize database connections for NodeSH
 * Auto-detects databases from environment variables
 */
export async function initDatabases(): Promise<{
  manager: ConnectionManager;
  helpers: ReturnType<ConnectionManager['createHelpers']>;
}> {
  const manager = getConnectionManager();
  await manager.autoConnect();
  const helpers = manager.createHelpers();
  
  return { manager, helpers };
}

/**
 * Quick database stats helper
 */
export async function getDBStats(): Promise<Record<string, unknown>> {
  const manager = getConnectionManager();
  return manager.getAllStatus();
}
