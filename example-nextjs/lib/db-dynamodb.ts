/**
 * DynamoDB Connection Example
 * 
 * This file demonstrates how to use NodeSH's DynamoDB adapter
 * for NoSQL operations in your Next.js application.
 * 
 * Supports both AWS DynamoDB and Local DynamoDB (for development)
 * 
 * Usage in NodeSH console:
 *   > await dynamo.listTables()
 *   > await dynamo.get('Users', { id: 'user-123' })
 *   > await dynamo.put('Users', { id: 'user-456', name: 'John' })
 *   > await dynamo.query('Users', { keyCondition: 'pk = :pk', values: { ':pk': 'user-123' } })
 */

import { createDynamoDBConnectionFromEnv } from '@eftech93/nodesh';

// Create DynamoDB connection using environment variables
// Required env vars: 
//   For AWS: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
//   For Local: DYNAMODB_LOCAL=true, DYNAMODB_ENDPOINT=http://localhost:8000

export const dynamo = createDynamoDBConnectionFromEnv();

/**
 * Example: User repository with DynamoDB
 */
export const UserDynamoRepo = {
  async findById(id: string) {
    return dynamo.get('Users', { id });
  },

  async findByEmail(email: string) {
    // Query on GSI
    return dynamo.query('Users', {
      index: 'EmailIndex',
      keyCondition: 'email = :email',
      values: { ':email': email },
    });
  },

  async create(data: {
    id?: string;
    name: string;
    email: string;
    role?: string;
    metadata?: Record<string, unknown>;
  }) {
    const id = data.id || `user-${Date.now()}`;
    const item = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      pk: `USER#${id}`,
      sk: `PROFILE#${id}`,
    };
    await dynamo.put('Users', item);
    return item;
  },

  async update(id: string, data: Partial<{ name: string; email: string; role: string }>) {
    const updateExpr: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (data.name) {
      updateExpr.push('#n = :n');
      names['#n'] = 'name';
      values[':n'] = data.name;
    }
    if (data.email) {
      updateExpr.push('#e = :e');
      names['#e'] = 'email';
      values[':e'] = data.email;
    }
    if (data.role) {
      updateExpr.push('#r = :r');
      names['#r'] = 'role';
      values[':r'] = data.role;
    }

    if (updateExpr.length === 0) return null;

    await dynamo.update(
      'Users',
      { id },
      `SET ${updateExpr.join(', ')}, updatedAt = :updatedAt`,
      names,
      { ...values, ':updatedAt': new Date().toISOString() }
    );

    return this.findById(id);
  },

  async delete(id: string) {
    await dynamo.delete('Users', { id });
    return true;
  },

  async list(limit = 100) {
    return dynamo.scan('Users', { limit });
  },

  async searchByRole(role: string) {
    return dynamo.query('Users', {
      index: 'RoleIndex',
      keyCondition: 'role = :role',
      values: { ':role': role },
    });
  },
};

/**
 * Example: Session store with DynamoDB
 */
export const SessionStore = {
  async create(sessionId: string, data: {
    userId: string;
    data?: Record<string, unknown>;
    ttl?: number; // Time to live in seconds
  }) {
    const ttl = data.ttl || 3600; // Default 1 hour
    const item = {
      sessionId,
      userId: data.userId,
      data: data.data || {},
      createdAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + ttl,
    };

    await dynamo.put('Sessions', item);
    return item;
  },

  async get(sessionId: string) {
    return dynamo.get('Sessions', { sessionId });
  },

  async delete(sessionId: string) {
    await dynamo.delete('Sessions', { sessionId });
  },

  async getByUserId(userId: string) {
    return dynamo.query('Sessions', {
      index: 'UserIdIndex',
      keyCondition: 'userId = :userId',
      values: { ':userId': userId },
    });
  },
};

/**
 * Example: Audit Log repository with DynamoDB
 */
export const AuditLog = {
  async log(event: {
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item = {
      id: logId,
      ...event,
      timestamp: new Date().toISOString(),
      pk: `${event.entityType}#${event.entityId}`,
      sk: `LOG#${event.action}#${Date.now()}`,
    };

    await dynamo.put('AuditLogs', item);
    return item;
  },

  async getLogsForEntity(entityType: string, entityId: string) {
    return dynamo.query('AuditLogs', {
      keyCondition: 'pk = :pk',
      values: { ':pk': `${entityType}#${entityId}` },
    });
  },

  async getLogsByAction(action: string, limit = 50) {
    return dynamo.query('AuditLogs', {
      index: 'ActionIndex',
      keyCondition: 'action = :action',
      values: { ':action': action },
      limit,
    });
  },

  async getRecentLogs(limit = 50) {
    return dynamo.scan('AuditLogs', { limit });
  },
};

/**
 * Initialize DynamoDB tables
 * Note: For production, use AWS CloudFormation or Terraform instead
 */
export async function initDynamoDBTables(): Promise<void> {
  await dynamo.connect();

  try {
    // Note: In production, create tables via CloudFormation/Terraform
    // This is for local development with DynamoDB Local

    console.log('⚠️  DynamoDB table creation should be done via:');
    console.log('   - AWS CloudFormation');
    console.log('   - AWS CDK');
    console.log('   - Terraform');
    console.log('   - Serverless Framework');
    console.log();
    console.log('For local development, DynamoDB Local accepts any table name.');
    console.log('Make sure to create your tables with proper keys and indexes.');

    // List existing tables
    const tables = await dynamo.listTables();
    console.log('Existing tables:', tables);
  } catch (err) {
    console.warn('DynamoDB initialization warning:', (err as Error).message);
  }
}

// Re-export for convenience
export { createDynamoDBConnectionFromEnv };
