/**
 * DynamoDB adapter for NodeSH
 * Uses AWS SDK v3 for DynamoDB
 */
import type { DatabaseAdapter, DatabaseConnection, ConnectionStatus } from '../types';

interface DynamoDBConfig {
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  tablePrefix?: string;
  // For local DynamoDB
  local?: boolean;
  port?: number;
}

// DynamoDB client types
interface DynamoDBClient {
  send(command: unknown): Promise<unknown>;
  destroy(): void;
}

interface DocClient {
  send(command: unknown): Promise<unknown>;
}

interface DocClientConstructor {
  from(client: DynamoDBClient): DocClient;
}

type PutCommandInput = {
  TableName: string;
  Item: Record<string, unknown>;
  ConditionExpression?: string;
};

type GetCommandInput = {
  TableName: string;
  Key: Record<string, unknown>;
};

type QueryCommandInput = {
  TableName: string;
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  IndexName?: string;
  Limit?: number;
  ScanIndexForward?: boolean;
};

type ScanCommandInput = {
  TableName: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
};

type DeleteCommandInput = {
  TableName: string;
  Key: Record<string, unknown>;
};

type UpdateCommandInput = {
  TableName: string;
  Key: Record<string, unknown>;
  UpdateExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
};

export class DynamoDBAdapter implements DatabaseAdapter {
  name = 'dynamodb';

  canHandle(config: unknown): boolean {
    if (typeof config !== 'object' || config === null) return false;
    const cfg = config as Record<string, unknown>;
    // DynamoDB config has region or is local
    return 'region' in cfg || 'local' in cfg || 'endpoint' in cfg;
  }

  async connect(config: DynamoDBConfig): Promise<DatabaseConnection> {
    const connection = new DynamoDBConnection(config);
    await connection.connect();
    return connection;
  }
}

export class DynamoDBConnection implements DatabaseConnection {
  id = 'dynamodb';
  type = 'dynamodb';
  isConnected = false;

  private config: DynamoDBConfig;
  private client: DynamoDBClient | null = null;
  private docClient: DocClient | null = null;

  constructor(config: DynamoConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.client) {
      this.isConnected = true;
      return;
    }

    try {
      // Load AWS SDK with optional NodeHttpHandler
      const aws = await importAwsSdk();

      // Build configuration
      const clientConfig: {
        region?: string;
        endpoint?: string;
        credentials?: {
          accessKeyId: string;
          secretAccessKey: string;
          sessionToken?: string;
        };
        requestHandler?: unknown;
        maxAttempts?: number;
      } = {
        region: this.config.region || process.env.AWS_REGION || 'us-east-1',
        maxAttempts: 2,
      };

      // Determine if using local DynamoDB
      const isLocalEndpoint = this.config.endpoint?.includes('localhost') || this.config.endpoint?.includes('127.0.0.1');
      const isLocal = this.config.local || isLocalEndpoint;

      // Local DynamoDB
      if (isLocal) {
        clientConfig.endpoint = this.config.endpoint || `http://localhost:${this.config.port || 8000}`;
        // DynamoDB Local requires dummy credentials
        clientConfig.credentials = {
          accessKeyId: this.config.accessKeyId || 'local',
          secretAccessKey: this.config.secretAccessKey || 'local',
        };
      } else if (this.config.endpoint) {
        clientConfig.endpoint = this.config.endpoint;
      }

      // Add timeout for local connections to avoid hanging
      if (isLocal && aws.NodeHttpHandler) {
        clientConfig.requestHandler = new aws.NodeHttpHandler({
          requestTimeout: 5000,
          connectionTimeout: 5000,
        });
      }

      // Custom credentials
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
          sessionToken: this.config.sessionToken,
        };
      }

      this.client = new aws.DynamoDBClient(clientConfig);
      this.docClient = aws.DynamoDBDocumentClient.from(this.client);

      // Test connection by listing tables
      await this.listTables();
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Failed to connect to DynamoDB: ${(err as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.docClient = null;
      this.isConnected = false;
    }
  }

  getStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      details: {
        region: this.config.region,
        endpoint: this.config.endpoint,
        local: this.config.local,
        tablePrefix: this.config.tablePrefix,
      },
    };
  }

  /**
   * List all tables
   */
  async listTables(): Promise<string[]> {
    if (!this.client) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.ListTablesCommand();
    const result = await this.client.send(command) as { TableNames?: string[] };
    return result.TableNames || [];
  }

  /**
   * Put an item
   */
  async put(tableName: string, item: Record<string, unknown>): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.PutCommand({
      TableName: this.prefixedTable(tableName),
      Item: item,
    } as PutCommandInput);
    
    await this.docClient.send(command);
  }

  /**
   * Get an item by key
   */
  async get(tableName: string, key: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.GetCommand({
      TableName: this.prefixedTable(tableName),
      Key: key,
    } as GetCommandInput);
    
    const result = await this.docClient.send(command) as { Item?: Record<string, unknown> };
    return result.Item || null;
  }

  /**
   * Query items
   */
  async query(
    tableName: string,
    options: {
      keyCondition?: string;
      filter?: string;
      names?: Record<string, string>;
      values?: Record<string, unknown>;
      index?: string;
      limit?: number;
      asc?: boolean;
    } = {}
  ): Promise<Record<string, unknown>[]> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.QueryCommand({
      TableName: this.prefixedTable(tableName),
      KeyConditionExpression: options.keyCondition,
      FilterExpression: options.filter,
      ExpressionAttributeNames: options.names,
      ExpressionAttributeValues: options.values,
      IndexName: options.index,
      Limit: options.limit,
      ScanIndexForward: options.asc,
    } as QueryCommandInput);
    
    const result = await this.docClient.send(command) as { Items?: Record<string, unknown>[] };
    return result.Items || [];
  }

  /**
   * Scan items
   */
  async scan(
    tableName: string,
    options: {
      filter?: string;
      names?: Record<string, string>;
      values?: Record<string, unknown>;
      limit?: number;
    } = {}
  ): Promise<Record<string, unknown>[]> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.ScanCommand({
      TableName: this.prefixedTable(tableName),
      FilterExpression: options.filter,
      ExpressionAttributeNames: options.names,
      ExpressionAttributeValues: options.values,
      Limit: options.limit,
    } as ScanCommandInput);
    
    const result = await this.docClient.send(command) as { Items?: Record<string, unknown>[] };
    return result.Items || [];
  }

  /**
   * Delete an item
   */
  async delete(tableName: string, key: Record<string, unknown>): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.DeleteCommand({
      TableName: this.prefixedTable(tableName),
      Key: key,
    } as DeleteCommandInput);
    
    await this.docClient.send(command);
  }

  /**
   * Update an item
   */
  async update(
    tableName: string,
    key: Record<string, unknown>,
    updateExpression: string,
    names?: Record<string, string>,
    values?: Record<string, unknown>
  ): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.UpdateCommand({
      TableName: this.prefixedTable(tableName),
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    } as UpdateCommandInput);
    
    await this.docClient.send(command);
  }

  /**
   * Get table description
   */
  async describeTable(tableName: string): Promise<unknown> {
    if (!this.client) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    const command = new aws.DescribeTableCommand({
      TableName: this.prefixedTable(tableName),
    });
    
    return this.client.send(command);
  }

  /**
   * Create a table
   */
  async createTable(config: {
    tableName: string;
    keySchema: Array<{ attributeName: string; keyType: 'HASH' | 'RANGE' }>;
    attributeDefinitions: Array<{ attributeName: string; attributeType: 'S' | 'N' | 'B' }>;
    billingMode?: 'PAY_PER_REQUEST' | 'PROVISIONED';
    provisionedThroughput?: {
      readCapacityUnits: number;
      writeCapacityUnits: number;
    };
    globalSecondaryIndexes?: Array<{
      indexName: string;
      keySchema: Array<{ attributeName: string; keyType: 'HASH' | 'RANGE' }>;
      projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
      provisionedThroughput?: {
        readCapacityUnits: number;
        writeCapacityUnits: number;
      };
    }>;
  }): Promise<void> {
    if (!this.client) {
      throw new Error('DynamoDB not connected');
    }

    const aws = await importAwsSdk();
    
    // Check if table already exists
    const tables = await this.listTables();
    const fullTableName = this.prefixedTable(config.tableName);
    if (tables.includes(fullTableName)) {
      return; // Table already exists
    }

    const input: CreateTableCommandInput = {
      TableName: fullTableName,
      KeySchema: config.keySchema.map((k) => ({
        AttributeName: k.attributeName,
        KeyType: k.keyType,
      })),
      AttributeDefinitions: config.attributeDefinitions.map((a) => ({
        AttributeName: a.attributeName,
        AttributeType: a.attributeType,
      })),
      BillingMode: config.billingMode || 'PAY_PER_REQUEST',
    };

    if (config.billingMode === 'PROVISIONED' && config.provisionedThroughput) {
      input.ProvisionedThroughput = {
        ReadCapacityUnits: config.provisionedThroughput.readCapacityUnits,
        WriteCapacityUnits: config.provisionedThroughput.writeCapacityUnits,
      };
    }

    if (config.globalSecondaryIndexes && config.globalSecondaryIndexes.length > 0) {
      input.GlobalSecondaryIndexes = config.globalSecondaryIndexes.map((gsi) => ({
        IndexName: gsi.indexName,
        KeySchema: gsi.keySchema.map((k) => ({
          AttributeName: k.attributeName,
          KeyType: k.keyType,
        })),
        Projection: { ProjectionType: gsi.projectionType },
        ...(gsi.provisionedThroughput && {
          ProvisionedThroughput: {
            ReadCapacityUnits: gsi.provisionedThroughput.readCapacityUnits,
            WriteCapacityUnits: gsi.provisionedThroughput.writeCapacityUnits,
          },
        }),
      }));
    }

    const command = new aws.CreateTableCommand(input);
    await this.client.send(command);
  }

  /**
   * Get all items from a table (with limit)
   */
  async getAll(tableName: string, limit = 100): Promise<Record<string, unknown>[]> {
    return this.scan(tableName, { limit });
  }

  private prefixedTable(name: string): string {
    return this.config.tablePrefix ? `${this.config.tablePrefix}${name}` : name;
  }
}

// Type alias for config
type DynamoConfig = DynamoDBConfig;

interface NodeHttpHandlerOptions {
  requestTimeout?: number;
  connectionTimeout?: number;
}

interface NodeHttpHandlerConstructor {
  new (options?: NodeHttpHandlerOptions): unknown;
}

type CreateTableCommandInput = {
  TableName: string;
  KeySchema: Array<{ AttributeName: string; KeyType: 'HASH' | 'RANGE' }>;
  AttributeDefinitions: Array<{ AttributeName: string; AttributeType: 'S' | 'N' | 'B' }>;
  BillingMode?: 'PAY_PER_REQUEST' | 'PROVISIONED';
  ProvisionedThroughput?: {
    ReadCapacityUnits: number;
    WriteCapacityUnits: number;
  };
  GlobalSecondaryIndexes?: Array<{
    IndexName: string;
    KeySchema: Array<{ AttributeName: string; KeyType: 'HASH' | 'RANGE' }>;
    Projection: { ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE' };
    ProvisionedThroughput?: {
      ReadCapacityUnits: number;
      WriteCapacityUnits: number;
    };
  }>;
};

async function importAwsSdk(): Promise<{
  DynamoDBClient: new (config: unknown) => DynamoDBClient;
  DynamoDBDocumentClient: DocClientConstructor;
  ListTablesCommand: new () => unknown;
  DescribeTableCommand: new (input: unknown) => unknown;
  CreateTableCommand: new (input: unknown) => unknown;
  PutCommand: new (input: unknown) => unknown;
  GetCommand: new (input: unknown) => unknown;
  QueryCommand: new (input: unknown) => unknown;
  ScanCommand: new (input: unknown) => unknown;
  DeleteCommand: new (input: unknown) => unknown;
  UpdateCommand: new (input: unknown) => unknown;
  NodeHttpHandler?: NodeHttpHandlerConstructor;
}> {
  try {
    // Try to load from project's node_modules first
    const clientDynamodbPath = require.resolve('@aws-sdk/client-dynamodb', { paths: [process.cwd()] });
    const libDynamodbPath = require.resolve('@aws-sdk/lib-dynamodb', { paths: [process.cwd()] });
    
    const { DynamoDBClient, ListTablesCommand, DescribeTableCommand, CreateTableCommand } = require(clientDynamodbPath);
    const { 
      DynamoDBDocumentClient, 
      PutCommand, 
      GetCommand, 
      QueryCommand, 
      ScanCommand,
      DeleteCommand,
      UpdateCommand,
    } = require(libDynamodbPath);
    
    // Try to load NodeHttpHandler for timeout configuration
    let NodeHttpHandler: NodeHttpHandlerConstructor | undefined;
    try {
      const nodeHttpHandlerPath = require.resolve('@smithy/node-http-handler', { paths: [process.cwd()] });
      const { NodeHttpHandler: HttpHandler } = require(nodeHttpHandlerPath);
      NodeHttpHandler = HttpHandler;
    } catch {
      // NodeHttpHandler not available, will use default
    }
    
    return {
      DynamoDBClient,
      DynamoDBDocumentClient,
      ListTablesCommand,
      DescribeTableCommand,
      CreateTableCommand,
      PutCommand,
      GetCommand,
      QueryCommand,
      ScanCommand,
      DeleteCommand,
      UpdateCommand,
      NodeHttpHandler,
    };
  } catch {
    try {
      // Fall back to default resolution
      const { DynamoDBClient, ListTablesCommand, DescribeTableCommand, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
      const { 
        DynamoDBDocumentClient, 
        PutCommand, 
        GetCommand, 
        QueryCommand, 
        ScanCommand,
        DeleteCommand,
        UpdateCommand,
      } = require('@aws-sdk/lib-dynamodb');
      
      return {
        DynamoDBClient,
        DynamoDBDocumentClient,
        ListTablesCommand,
        DescribeTableCommand,
        CreateTableCommand,
        PutCommand,
        GetCommand,
        QueryCommand,
        ScanCommand,
        DeleteCommand,
        UpdateCommand,
      };
    } catch {
      throw new Error('@aws-sdk/client-dynamodb not installed. Run: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb');
    }
  }
}

/** Create DynamoDB connection from environment variables */
export function createDynamoDBConnectionFromEnv(): DynamoDBConnection {
  const config: DynamoDBConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    tablePrefix: process.env.DYNAMODB_TABLE_PREFIX,
    local: process.env.DYNAMODB_LOCAL === 'true',
    port: process.env.DYNAMODB_PORT ? parseInt(process.env.DYNAMODB_PORT) : 8000,
  };
  return new DynamoDBConnection(config);
}
