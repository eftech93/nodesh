import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private client: DynamoDBDocumentClient;
  private readonly tableName = 'Analytics';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.configService.get('DYNAMODB_ENDPOINT', 'http://localhost:8000');
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    
    const dynamoClient = new DynamoDBClient({
      endpoint,
      region,
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    
    // Note: In production, you'd use the AWS SDK to create tables
    // For local development, tables should be created via setup script
    console.log('✅ DynamoDB: Client initialized');
  }

  async recordEvent(eventType: string, data: Record<string, any>) {
    const item = {
      PK: `EVENT#${eventType}`,
      SK: `TS#${Date.now()}`,
      eventType,
      timestamp: new Date().toISOString(),
      ...data,
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
    }));

    return item;
  }

  async recordPageView(page: string, userId?: string) {
    return this.recordEvent('PAGE_VIEW', {
      page,
      userId: userId || 'anonymous',
    });
  }

  async recordPurchase(orderId: string, amount: number, customerId: string) {
    return this.recordEvent('PURCHASE', {
      orderId,
      amount,
      customerId,
    });
  }

  async getEventsByType(eventType: string, limit: number = 50) {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `EVENT#${eventType}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    }));

    return result.Items || [];
  }

  async getRecentEvents(limit: number = 50) {
    const result = await this.client.send(new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
    }));

    return (result.Items || []).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  async getStats() {
    const [pageViews, purchases] = await Promise.all([
      this.getEventsByType('PAGE_VIEW', 1000),
      this.getEventsByType('PURCHASE', 1000),
    ]);

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const uniquePages = new Set(pageViews.map(p => p.page)).size;

    return {
      totalPageViews: pageViews.length,
      totalPurchases: purchases.length,
      totalRevenue,
      uniquePages,
      conversionRate: pageViews.length > 0 ? (purchases.length / pageViews.length * 100).toFixed(2) : 0,
    };
  }
}
