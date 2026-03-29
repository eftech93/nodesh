#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates DynamoDB tables for local development
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
const REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

async function setupDynamoDB() {
  console.log('🔄 Setting up DynamoDB...');
  
  try {
    // Check if table exists
    const listResult = await client.send(new ListTablesCommand({}));
    
    if (listResult.TableNames?.includes('Analytics')) {
      console.log('✅ Analytics table already exists');
      return;
    }
    
    // Create Analytics table
    const params = {
      TableName: 'Analytics',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    };
    
    await client.send(new CreateTableCommand(params));
    console.log('✅ Analytics table created');
  } catch (error) {
    console.error('❌ Error setting up DynamoDB:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Setting up databases...\n');
  
  await setupDynamoDB();
  
  console.log('\n✅ All databases configured!');
  console.log('\nYou can now run:');
  console.log('  npm run console       # Start NodeSH console');
  console.log('  npm run start:dev     # Start NestJS in dev mode');
}

main();
