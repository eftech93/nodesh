import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class RecommendationsService implements OnModuleInit {
  private driver: Driver;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get('NEO4J_URI', 'bolt://localhost:7687');
    const user = this.configService.get('NEO4J_USER', 'neo4j');
    const password = this.configService.get('NEO4J_PASSWORD', 'password');
    
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Test connection and seed data
    try {
      await this.verifyConnectivity();
      await this.seedData();
    } catch (error) {
      console.log('⚠️ Neo4j not available:', error.message);
    }
  }

  private async verifyConnectivity() {
    await this.driver.verifyConnectivity();
    console.log('✅ Neo4j: Connected');
  }

  private async seedData() {
    const session = this.driver.session();
    try {
      // Create some sample product relationships
      const query = `
        MERGE (p1:Product {id: 'prod-1', name: 'Laptop'})
        MERGE (p2:Product {id: 'prod-2', name: 'Mouse'})
        MERGE (p3:Product {id: 'prod-3', name: 'Keyboard'})
        MERGE (p4:Product {id: 'prod-4', name: 'Monitor'})
        MERGE (p5:Product {id: 'prod-5', name: 'Webcam'})
        MERGE (p1)-[:FREQUENTLY_BOUGHT_WITH {weight: 0.8}]->(p2)
        MERGE (p1)-[:FREQUENTLY_BOUGHT_WITH {weight: 0.7}]->(p3)
        MERGE (p1)-[:FREQUENTLY_BOUGHT_WITH {weight: 0.6}]->(p4)
        MERGE (p2)-[:FREQUENTLY_BOUGHT_WITH {weight: 0.5}]->(p3)
        MERGE (p4)-[:FREQUENTLY_BOUGHT_WITH {weight: 0.4}]->(p5)
        RETURN count(*) as count
      `;
      await session.run(query);
      console.log('✅ Neo4j: Product relationships seeded');
    } finally {
      await session.close();
    }
  }

  async getRecommendations(productId: string, limit: number = 5) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Product {id: $productId})-[r:FREQUENTLY_BOUGHT_WITH]-(recommended:Product)
        RETURN recommended.id as id, recommended.name as name, r.weight as score
        ORDER BY r.weight DESC
        LIMIT $limit
        `,
        { productId, limit: parseInt(String(limit)) }
      );
      
      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        score: record.get('score'),
      }));
    } finally {
      await session.close();
    }
  }

  async createProductView(customerId: string, productId: string) {
    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (c:Customer {id: $customerId})
        MERGE (p:Product {id: $productId})
        MERGE (c)-[v:VIEWED]->(p)
        ON CREATE SET v.count = 1, v.firstViewed = datetime()
        ON MATCH SET v.count = v.count + 1, v.lastViewed = datetime()
        `,
        { customerId, productId }
      );
      return { success: true };
    } finally {
      await session.close();
    }
  }

  async getCustomerRecommendations(customerId: string, limit: number = 5) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (c:Customer {id: $customerId})-[:VIEWED]->(p:Product)
        MATCH (p)-[:FREQUENTLY_BOUGHT_WITH]-(recommended:Product)
        WHERE NOT (c)-[:VIEWED]->(recommended)
        RETURN recommended.id as id, recommended.name as name, sum(r.weight) as score
        ORDER BY score DESC
        LIMIT $limit
        `,
        { customerId, limit: parseInt(String(limit)) }
      );
      
      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        score: record.get('score'),
      }));
    } finally {
      await session.close();
    }
  }

  async getStats() {
    const session = this.driver.session();
    try {
      const [productsResult, customersResult, relationshipsResult] = await Promise.all([
        session.run('MATCH (p:Product) RETURN count(p) as count'),
        session.run('MATCH (c:Customer) RETURN count(c) as count'),
        session.run('MATCH ()-[r]->() RETURN count(r) as count'),
      ]);
      
      return {
        products: productsResult.records[0].get('count').toNumber(),
        customers: customersResult.records[0].get('count').toNumber(),
        relationships: relationshipsResult.records[0].get('count').toNumber(),
      };
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
