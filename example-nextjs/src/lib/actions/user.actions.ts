'use server';

/**
 * User Server Actions
 * 
 * These actions can be called from the NodeSH console for testing
 */

interface UserData {
  id?: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

// In-memory store for demo purposes
const users: Map<string, UserData> = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }],
]);

/**
 * Get all users
 */
export async function getUsers(): Promise<UserData[]> {
  console.log('[Server Action] Fetching all users...');
  await simulateDelay(100);
  return Array.from(users.values());
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<UserData | null> {
  console.log(`[Server Action] Fetching user ${id}...`);
  await simulateDelay(50);
  return users.get(id) || null;
}

/**
 * Create a new user
 */
export async function createUser(data: Omit<UserData, 'id'>): Promise<UserData> {
  console.log('[Server Action] Creating user:', data);
  await simulateDelay(200);
  
  const id = Math.random().toString(36).substring(2, 9);
  const newUser: UserData = { ...data, id };
  users.set(id, newUser);
  
  return newUser;
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, data: Partial<UserData>): Promise<UserData | null> {
  console.log(`[Server Action] Updating user ${id}:`, data);
  await simulateDelay(150);
  
  const existing = users.get(id);
  if (!existing) return null;
  
  const updated = { ...existing, ...data };
  users.set(id, updated);
  
  return updated;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  console.log(`[Server Action] Deleting user ${id}...`);
  await simulateDelay(100);
  return users.delete(id);
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string): Promise<UserData[]> {
  console.log(`[Server Action] Searching users for "${query}"...`);
  await simulateDelay(100);
  
  const lowerQuery = query.toLowerCase();
  return Array.from(users.values()).filter(user =>
    user.name.toLowerCase().includes(lowerQuery) ||
    user.email.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to simulate network delay
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
