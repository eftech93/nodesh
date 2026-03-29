/**
 * User Model for DynamoDB
 * Used with UserDynamoRepo in lib/db-dynamodb.ts
 */

export interface DynamoUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  // Composite keys for DynamoDB
  pk: string;
  sk: string;
}

export interface DynamoSession {
  sessionId: string;
  userId: string;
  data?: Record<string, unknown>;
  createdAt: string;
  ttl: number;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  pk: string;
  sk: string;
}

export function createUserItem(data: {
  id?: string;
  name: string;
  email: string;
  role?: string;
  metadata?: Record<string, unknown>;
}): DynamoUser {
  const id = data.id || `user-${Date.now()}`;
  const now = new Date().toISOString();
  
  return {
    id,
    name: data.name,
    email: data.email,
    role: (data.role as 'user' | 'admin') || 'user',
    metadata: data.metadata || {},
    createdAt: now,
    pk: `USER#${id}`,
    sk: `PROFILE#${id}`,
  };
}

export function validateDynamoUser(data: Partial<DynamoUser>): string[] {
  const errors: string[] = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (data.role && !['user', 'admin'].includes(data.role)) {
    errors.push('Role must be user or admin');
  }
  
  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
