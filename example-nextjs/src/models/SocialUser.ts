/**
 * Social User Model for Neo4j Graph Database
 * Used with SocialGraph in lib/db-neo4j.ts
 */

export interface SocialUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Post {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  author?: SocialUser;
}

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface SocialStats {
  followers: number;
  following: number;
}

export function validateSocialUser(data: Partial<SocialUser>): string[] {
  const errors: string[] = [];
  
  if (!data.id) {
    errors.push('ID is required');
  }
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
