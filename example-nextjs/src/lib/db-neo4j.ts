/**
 * Neo4j Graph Database Connection
 * Uses the NodeSH Neo4j adapter
 */

import { createNeo4jConnectionFromEnv, Neo4jConnection } from '@eftech93/nodesh';
import { SocialUser, Post, FollowRelationship } from '@/models/SocialUser';

// Export the raw driver for advanced queries
export let neo4jDriver: any;

// Connection instance
let connection: Neo4jConnection | null = null;

export async function connectNeo4j(): Promise<Neo4jConnection> {
  if (!connection) {
    connection = await createNeo4jConnectionFromEnv();
    neo4jDriver = (connection as any).driver;
  }
  return connection;
}

// Initialize (Neo4j is schemaless, just verify connection)
export async function initNeo4j(): Promise<void> {
  await connectNeo4j();
}

// Social Graph Repository
export const SocialGraph = {
  async createUser(user: SocialUser): Promise<SocialUser> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      await session.run(
        `CREATE (u:User {id: $id, name: $name, email: $email, bio: $bio, avatar: $avatar, createdAt: $createdAt})`,
        user
      );
      return user;
    } finally {
      await session.close();
    }
  },
  
  async getUser(id: string): Promise<SocialUser | null> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      const result = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id }
      );
      
      if (result.records.length === 0) return null;
      const user = result.records[0].get('u').properties;
      return user as SocialUser;
    } finally {
      await session.close();
    }
  },
  
  async createFollow(followerId: string, followingId: string): Promise<FollowRelationship> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    const relationship: FollowRelationship = {
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await session.run(
        `MATCH (follower:User {id: $followerId}), (following:User {id: $followingId})
         CREATE (follower)-[:FOLLOWS {createdAt: $createdAt}]->(following)`,
        relationship
      );
      return relationship;
    } finally {
      await session.close();
    }
  },
  
  async getFollowers(userId: string): Promise<SocialUser[]> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (follower:User)-[:FOLLOWS]->(u:User {id: $id})
         RETURN follower`,
        { id: userId }
      );
      
      return result.records.map((r: { get: (key: string) => { properties: SocialUser } }) => r.get('follower').properties as SocialUser);
    } finally {
      await session.close();
    }
  },
  
  async getFollowing(userId: string): Promise<SocialUser[]> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id})-[:FOLLOWS]->(following:User)
         RETURN following`,
        { id: userId }
      );
      
      return result.records.map((r: { get: (key: string) => { properties: SocialUser } }) => r.get('following').properties as SocialUser);
    } finally {
      await session.close();
    }
  },
  
  async getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(u)
         OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
         RETURN count(DISTINCT follower) as followers, count(DISTINCT following) as following`,
        { id: userId }
      );
      
      const record = result.records[0];
      return {
        followers: record.get('followers').toInt(),
        following: record.get('following').toInt(),
      };
    } finally {
      await session.close();
    }
  },
  
  async getFollowSuggestions(userId: string, limit = 5): Promise<SocialUser[]> {
    await connectNeo4j();
    const driver = (connection as any).driver;
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggestion:User)
         WHERE suggestion.id <> $id AND NOT (u)-[:FOLLOWS]->(suggestion)
         RETURN suggestion, count(*) as score
         ORDER BY score DESC
         LIMIT $limit`,
        { id: userId, limit }
      );
      
      return result.records.map((r: { get: (key: string) => { properties: SocialUser } }) => r.get('suggestion').properties as SocialUser);
    } finally {
      await session.close();
    }
  },
};
