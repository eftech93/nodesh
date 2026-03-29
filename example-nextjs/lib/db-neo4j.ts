/**
 * Neo4j Graph Database Connection Example
 * 
 * This file demonstrates how to use NodeSH's Neo4j adapter
 * for graph database operations in your Next.js application.
 * 
 * Usage in NodeSH console:
 *   > await neo4j.run('MATCH (n:User) RETURN n LIMIT 10')
 *   > await neo4j.read('MATCH (u:User)-[:FOLLOWS]->(f:User) RETURN u, f')
 *   > await neo4j.getLabels()
 *   > await neo4j.getStats()
 */

import { createNeo4jConnectionFromEnv } from '@eftech93/nodesh';

// Create Neo4j connection using environment variables
// Required env vars: NEO4J_URI or NEO4J_HOST, NEO4J_USER, NEO4J_PASSWORD

export const neo4j = createNeo4jConnectionFromEnv();

/**
 * Example: Social Graph Repository
 * Demonstrates graph relationships (followers, friends, etc.)
 */
export const SocialGraph = {
  async createUser(data: { 
    id: string; 
    name: string; 
    email: string;
    bio?: string;
  }) {
    const { records } = await neo4j.run(`
      CREATE (u:User {
        id: $id,
        name: $name,
        email: $email,
        bio: $bio,
        createdAt: datetime()
      })
      RETURN u
    `, data);
    return records[0]?.u;
  },

  async findUserById(id: string) {
    const users = await neo4j.read(`
      MATCH (u:User {id: $id})
      RETURN u
    `, { id });
    return users[0]?.u || null;
  },

  async findUserByEmail(email: string) {
    const users = await neo4j.read(`
      MATCH (u:User {email: $email})
      RETURN u
    `, { email });
    return users[0]?.u || null;
  },

  async searchUsers(query: string) {
    return neo4j.read(`
      MATCH (u:User)
      WHERE u.name CONTAINS $query OR u.email CONTAINS $query
      RETURN u
      LIMIT 20
    `, { query });
  },

  /**
   * Create a FOLLOWS relationship between users
   */
  async follow(followerId: string, followingId: string) {
    const { records, counters } = await neo4j.write(`
      MATCH (follower:User {id: $followerId})
      MATCH (following:User {id: $followingId})
      WHERE follower <> following
      MERGE (follower)-[r:FOLLOWS {createdAt: datetime()}]->(following)
      RETURN r
    `, { followerId, followingId });

    return {
      success: (counters?.relationshipsCreated || 0) > 0,
      relationship: records[0]?.r,
    };
  },

  /**
   * Unfollow a user
   */
  async unfollow(followerId: string, followingId: string) {
    const { counters } = await neo4j.write(`
      MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(following:User {id: $followingId})
      DELETE r
    `, { followerId, followingId });

    return (counters?.relationshipsDeleted || 0) > 0;
  },

  /**
   * Get user's followers
   */
  async getFollowers(userId: string) {
    return neo4j.read(`
      MATCH (follower:User)-[:FOLLOWS]->(u:User {id: $userId})
      RETURN follower
      ORDER BY follower.name
    `, { userId });
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string) {
    return neo4j.read(`
      MATCH (u:User {id: $userId})-[:FOLLOWS]->(following:User)
      RETURN following
      ORDER BY following.name
    `, { userId });
  },

  /**
   * Get mutual followers (friends)
   */
  async getFriends(userId: string) {
    return neo4j.read(`
      MATCH (u:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(u)
      RETURN friend
      ORDER BY friend.name
    `, { userId });
  },

  /**
   * Get follower/following counts
   */
  async getCounts(userId: string) {
    const result = await neo4j.read(`
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
      OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
      RETURN 
        count(DISTINCT follower) as followers,
        count(DISTINCT following) as following
    `, { userId });

    return {
      followers: parseInt((result[0]?.followers as string) || '0'),
      following: parseInt((result[0]?.following as string) || '0'),
    };
  },

  /**
   * Get recommended users to follow (friends of friends)
   */
  async getRecommendations(userId: string, limit = 5) {
    return neo4j.read(`
      MATCH (u:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommended:User)
      WHERE NOT (u)-[:FOLLOWS]->(recommended) AND u <> recommended
      RETURN recommended, count(friend) as mutualFriends
      ORDER BY mutualFriends DESC
      LIMIT $limit
    `, { userId, limit });
  },

  /**
   * Create a post node
   */
  async createPost(userId: string, content: string, tags?: string[]) {
    const { records } = await neo4j.run(`
      MATCH (u:User {id: $userId})
      CREATE (p:Post {
        id: randomUUID(),
        content: $content,
        tags: $tags,
        createdAt: datetime()
      })
      CREATE (u)-[:AUTHORED]->(p)
      RETURN p
    `, { userId, content, tags: tags || [] });

    return records[0]?.p;
  },

  /**
   * Get user's feed (posts from followed users)
   */
  async getFeed(userId: string, limit = 20) {
    return neo4j.read(`
      MATCH (u:User {id: $userId})-[:FOLLOWS]->(author:User)-[:AUTHORED]->(post:Post)
      RETURN post, author
      ORDER BY post.createdAt DESC
      LIMIT $limit
    `, { userId, limit });
  },

  /**
   * Like a post
   */
  async likePost(userId: string, postId: string) {
    const { counters } = await neo4j.write(`
      MATCH (u:User {id: $userId})
      MATCH (p:Post {id: $postId})
      MERGE (u)-[r:LIKED {createdAt: datetime()}]->(p)
      RETURN r
    `, { userId, postId });

    return (counters?.relationshipsCreated || 0) > 0;
  },
};

/**
 * Example: Knowledge Graph Repository
 * Demonstrates hierarchical relationships
 */
export const KnowledgeGraph = {
  async createCategory(name: string, parentName?: string) {
    if (parentName) {
      const { records } = await neo4j.run(`
        MATCH (parent:Category {name: $parentName})
        CREATE (c:Category {name: $name, createdAt: datetime()})
        CREATE (c)-[:BELONGS_TO]->(parent)
        RETURN c
      `, { name, parentName });
      return records[0]?.c;
    } else {
      const { records } = await neo4j.run(`
        CREATE (c:Category {name: $name, createdAt: datetime()})
        RETURN c
      `, { name });
      return records[0]?.c;
    }
  },

  async getCategoryTree(rootName: string) {
    return neo4j.read(`
      MATCH path = (root:Category {name: $rootName})<-[:BELONGS_TO*0..10]-(child:Category)
      RETURN root, child, length(path) as depth
      ORDER BY depth, child.name
    `, { rootName });
  },
};

/**
 * Initialize Neo4j constraints and indexes
 */
export async function initNeo4jSchema(): Promise<void> {
  await neo4j.connect();

  try {
    // Create constraints
    await neo4j.run(`
      CREATE CONSTRAINT user_id IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);

    await neo4j.run(`
      CREATE CONSTRAINT user_email IF NOT EXISTS
      FOR (u:User) REQUIRE u.email IS UNIQUE
    `);

    await neo4j.run(`
      CREATE CONSTRAINT post_id IF NOT EXISTS
      FOR (p:Post) REQUIRE p.id IS UNIQUE
    `);

    // Create indexes
    await neo4j.run(`
      CREATE INDEX user_name IF NOT EXISTS
      FOR (u:User) ON (u.name)
    `);

    console.log('✅ Neo4j schema initialized');
  } catch (err) {
    console.warn('Neo4j schema initialization warning:', (err as Error).message);
  }
}

// Re-export for convenience
export { createNeo4jConnectionFromEnv };
