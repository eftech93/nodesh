'use server';

/**
 * DynamoDB User Server Actions
 */

import { UserDynamoRepo, initDynamoDB } from '@/lib/db-dynamodb';
import { validateDynamoUser, createUserItem } from '@/models/DynamoUser';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initDynamoDB();
    initialized = true;
  }
}

export async function getDynamoUsers(limit = 100) {
  'use server';
  await ensureTables();
  return UserDynamoRepo.list(limit);
}

export async function getDynamoUserById(id: string) {
  'use server';
  await ensureTables();
  return UserDynamoRepo.findById(id);
}

export async function getDynamoUserByEmail(email: string) {
  'use server';
  await ensureTables();
  return UserDynamoRepo.findByEmail(email);
}

export async function createDynamoUser(data: {
  id?: string;
  name: string;
  email: string;
  role?: string;
  metadata?: Record<string, unknown>;
}) {
  'use server';
  await ensureTables();
  
  const userData = createUserItem(data);
  const errors = validateDynamoUser(userData);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return UserDynamoRepo.create(data);
}

export async function updateDynamoUser(
  id: string,
  data: Partial<{ name: string; email: string; role: 'user' | 'admin' }>
) {
  'use server';
  await ensureTables();
  return UserDynamoRepo.update(id, data);
}

export async function deleteDynamoUser(id: string) {
  'use server';
  await ensureTables();
  return UserDynamoRepo.delete(id);
}

export async function getDynamoUserCount() {
  'use server';
  await ensureTables();
  const users = await UserDynamoRepo.list();
  return users.length;
}
