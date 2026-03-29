'use server';

/**
 * Social Graph Server Actions - Neo4j
 */

import { SocialGraph, initNeo4j } from '@/lib/db-neo4j';
import { validateSocialUser } from '@/models/SocialUser';

let initialized = false;
async function ensureSchema() {
  if (!initialized) {
    await initNeo4j();
    initialized = true;
  }
}

export async function createSocialUser(data: {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}) {
  'use server';
  await ensureSchema();
  
  const errors = validateSocialUser(data);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return SocialGraph.createUser(data);
}

export async function getSocialUser(id: string) {
  'use server';
  await ensureSchema();
  return SocialGraph.getUser(id);
}

export async function followUser(followerId: string, followingId: string) {
  'use server';
  await ensureSchema();
  return SocialGraph.createFollow(followerId, followingId);
}

export async function getFollowers(userId: string) {
  'use server';
  await ensureSchema();
  return SocialGraph.getFollowers(userId);
}

export async function getFollowing(userId: string) {
  'use server';
  await ensureSchema();
  return SocialGraph.getFollowing(userId);
}

export async function getSocialStats(userId: string) {
  'use server';
  await ensureSchema();
  return SocialGraph.getFollowStats(userId);
}

export async function getRecommendations(userId: string, limit = 5) {
  'use server';
  await ensureSchema();
  return SocialGraph.getFollowSuggestions(userId, limit);
}
