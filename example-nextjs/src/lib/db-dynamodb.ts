/**
 * DynamoDB Connection
 * Uses the NodeSH DynamoDB adapter
 */

import { createDynamoDBConnectionFromEnv, DynamoDBConnection } from '@eftech93/nodesh';
import { DynamoUser, DynamoSession, AuditLogEntry, createUserItem } from '@/models/DynamoUser';

// Connection instance
let connection: DynamoDBConnection | null = null;

export async function connectDynamoDB(): Promise<DynamoDBConnection> {
  if (!connection) {
    connection = createDynamoDBConnectionFromEnv();
    await connection.connect();
  }
  return connection;
}

// Initialize tables
export async function initDynamoDB(): Promise<void> {
  const conn = await connectDynamoDB();
  
  // Create Users table if it doesn't exist
  const tableName = process.env.DYNAMODB_TABLE_USERS || 'Users';
  await (conn as any).createTable({
    tableName,
    keySchema: [
      { attributeName: 'pk', keyType: 'HASH' },
      { attributeName: 'sk', keyType: 'RANGE' },
    ],
    attributeDefinitions: [
      { attributeName: 'pk', attributeType: 'S' },
      { attributeName: 'sk', attributeType: 'S' },
      { attributeName: 'email', attributeType: 'S' },
    ],
    billingMode: 'PAY_PER_REQUEST',
    globalSecondaryIndexes: [
      {
        indexName: 'EmailIndex',
        keySchema: [{ attributeName: 'email', keyType: 'HASH' }],
        projectionType: 'ALL',
      },
    ],
  });
}

// DynamoDB Repository for Users
export const UserDynamoRepo = {
  async create(data: {
    id?: string;
    name: string;
    email: string;
    role?: string;
    metadata?: Record<string, unknown>;
  }): Promise<DynamoUser> {
    const conn = await connectDynamoDB();
    const user = createUserItem(data);
    
    await (conn as any).put(process.env.DYNAMODB_TABLE_USERS || 'Users', user);
    return user;
  },
  
  async findById(id: string): Promise<DynamoUser | null> {
    const conn = await connectDynamoDB();
    
    return await (conn as any).get(process.env.DYNAMODB_TABLE_USERS || 'Users', {
      pk: `USER#${id}`,
      sk: `PROFILE#${id}`,
    }) as DynamoUser | null;
  },
  
  async findByEmail(email: string): Promise<DynamoUser | null> {
    const conn = await connectDynamoDB();
    
    const result = await (conn as any).query(
      process.env.DYNAMODB_TABLE_USERS || 'Users',
      'EmailIndex',
      { email }
    );
    
    return (result[0] as DynamoUser) || null;
  },
  
  async update(id: string, data: Partial<DynamoUser>): Promise<DynamoUser | null> {
    const conn = await connectDynamoDB();
    
    const key = {
      pk: `USER#${id}`,
      sk: `PROFILE#${id}`,
    };
    
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;
    if (data.role) updates.role = data.role;
    if (data.metadata) updates.metadata = data.metadata;
    updates.updatedAt = new Date().toISOString();
    
    const updated = await (conn as any).update(
      process.env.DYNAMODB_TABLE_USERS || 'Users',
      key,
      updates
    );
    
    return updated as DynamoUser;
  },
  
  async delete(id: string): Promise<void> {
    const conn = await connectDynamoDB();
    
    await (conn as any).deleteItem(process.env.DYNAMODB_TABLE_USERS || 'Users', {
      pk: `USER#${id}`,
      sk: `PROFILE#${id}`,
    });
  },
  
  async list(limit = 100): Promise<DynamoUser[]> {
    const conn = await connectDynamoDB();
    
    return await (conn as any).scan(
      process.env.DYNAMODB_TABLE_USERS || 'Users',
      limit
    ) as DynamoUser[];
  },
};

// Session Repository
export const SessionRepo = {
  async create(session: DynamoSession): Promise<void> {
    const conn = await connectDynamoDB();
    
    await (conn as any).put(process.env.DYNAMODB_TABLE_SESSIONS || 'Sessions', session);
  },
  
  async findById(sessionId: string): Promise<DynamoSession | null> {
    const conn = await connectDynamoDB();
    
    return await (conn as any).get(process.env.DYNAMODB_TABLE_SESSIONS || 'Sessions', {
      sessionId,
    }) as DynamoSession | null;
  },
  
  async delete(sessionId: string): Promise<void> {
    const conn = await connectDynamoDB();
    
    await (conn as any).deleteItem(process.env.DYNAMODB_TABLE_SESSIONS || 'Sessions', {
      sessionId,
    });
  },
};
