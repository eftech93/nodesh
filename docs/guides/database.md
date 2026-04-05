# Database Support

NodeSH includes a unified database connection manager supporting **7+ databases** with automatic detection and connection.

## Supported Databases Overview

```mermaid
flowchart LR
    subgraph Document["📄 Document"]
        M[MongoDB]
    end
    
    subgraph Relational["📊 Relational"]
        P[PostgreSQL]
        MY[MySQL]
    end
    
    subgraph KeyValue["⚡ Key-Value"]
        R[Redis]
    end
    
    subgraph Graph["🕸️ Graph"]
        N[Neo4j]
    end
    
    subgraph NoSQL["📦 NoSQL"]
        D[DynamoDB]
    end
    
    subgraph Universal["🔄 Universal"]
        PR[Prisma]
    end
    
    NodeSH --> M
    NodeSH --> P
    NodeSH --> MY
    NodeSH --> R
    NodeSH --> N
    NodeSH --> D
    NodeSH --> PR
```

## Database Comparison

| Database | Type | Best For | Adapter |
|----------|------|----------|---------|
| **MongoDB** | Document Store | Flexible schemas, JSON data | mongoose |
| **PostgreSQL** | Relational | Complex queries, ACID compliance | pg |
| **MySQL** | Relational | Web applications, LAMP stack | mysql2 |
| **Redis** | Key-Value | Caching, sessions, real-time data | ioredis |
| **Prisma** | Universal ORM | Type-safe database access | @prisma/client |
| **Neo4j** | Graph | Relationships, network analysis | neo4j-driver |
| **DynamoDB** | NoSQL | AWS, serverless, high scale | aws-sdk |

## Quick Start

### Auto-Detect All Databases

```javascript
const { initDatabases, getConnectionManager } = require('@eftech93/nodesh');

// Auto-detect and connect from environment variables
const { manager, helpers } = await initDatabases();

// Get connections
const mongo = manager.get('mongodb');
const redis = manager.get('redis');

// Get all stats
await helpers.getDBStats();
```

### Using in NodeSH Shell

Once initialized, database connections are available in the shell context:

```javascript
// MongoDB operations
node> await User.find({ isActive: true })
node> await User.countDocuments()

// Redis operations  
node> await cacheService.get('user:123')
node> await cacheService.set('user:123', user)

// Direct connection access
node> const mongo = db.manager.get('mongodb')
node> await mongo.connection.db.listCollections().toArray()
```

## Connection Manager

### Get Connection

```javascript
const manager = getConnectionManager();

// Get specific connection
const mongo = manager.get('mongodb');
const postgres = manager.get('postgresql');
const mysql = manager.get('mysql');
const redis = manager.get('redis');
const neo4j = manager.get('neo4j');
const dynamo = manager.get('dynamodb');
const prisma = manager.get('prisma');
```

### Check Connection Status

```javascript
// Check if connected
const isConnected = manager.isConnected('mongodb');

// Get all statuses
const statuses = manager.getAllStatuses();
// Returns: { mongodb: 'connected', redis: 'connected', ... }
```

### Close Connections

```javascript
// Close all connections
await manager.closeAll();

// Close specific connection
await manager.close('mongodb');
```

## Database Adapters

### MongoDB Adapter

**Features:**
- Mongoose ODM integration
- Connection pooling
- Automatic model loading
- GridFS support

**Setup:**
```bash
npm install mongoose
```

**Environment:**
```bash
# Connection string
MONGODB_URI=mongodb://localhost:27017/myapp

# Or individual components
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=myapp
MONGODB_USER=admin
MONGODB_PASS=secret
```

**Usage:**
```javascript
const mongo = manager.get('mongodb');

// Access Mongoose connection
const connection = mongo.connection;

// List collections
const collections = await connection.db.listCollections().toArray();

// Run admin command
await connection.db.admin().ping();

// Access models
const User = connection.model('User');
const users = await User.find();
```

### PostgreSQL Adapter

**Features:**
- Native pg driver support
- Parameterized queries
- Transaction support
- Connection pooling

**Setup:**
```bash
npm install pg
```

**Environment:**
```bash
# Connection string
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# Or individual components
PGHOST=localhost
PGPORT=5432
PGDATABASE=myapp
PGUSER=admin
PGPASSWORD=secret
```

**Usage:**
```javascript
const pg = manager.get('postgresql');

// Query
const result = await pg.query('SELECT * FROM users WHERE active = $1', [true]);
console.log(result.rows);

// Get tables
const tables = await pg.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
`);

// Transaction
const client = await pg.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users(name) VALUES($1)', ['John']);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### MySQL Adapter

**Features:**
- mysql2 driver (with Promise support)
- Connection pooling
- Prepared statements
- MySQL/MariaDB compatible

**Setup:**
```bash
npm install mysql2
```

**Environment:**
```bash
# Connection string
DATABASE_URL=mysql://user:pass@localhost:3306/myapp

# Or individual components
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=myapp
MYSQL_USER=admin
MYSQL_PASSWORD=secret
```

**Usage:**
```javascript
const mysql = manager.get('mysql');

// Query
const [rows] = await mysql.execute('SELECT * FROM users WHERE active = ?', [true]);

// Insert
const [result] = await mysql.execute(
  'INSERT INTO users(name, email) VALUES(?, ?)',
  ['John', 'john@example.com']
);
console.log(result.insertId);
```

### Redis Adapter

**Features:**
- ioredis driver
- Cluster/Sentinel support
- Pub/Sub support
- Pipeline support

**Setup:**
```bash
npm install ioredis
```

**Environment:**
```bash
# Connection string
REDIS_URL=redis://localhost:6379

# Or individual components
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0
```

**Usage:**
```javascript
const redis = manager.get('redis');

// Basic operations
await redis.set('key', 'value');
const value = await redis.get('key');

// Expiration
await redis.setex('session', 3600, 'data');

// Hash operations
await redis.hset('user:1', 'name', 'John');
const name = await redis.hget('user:1', 'name');

// Lists
await redis.lpush('queue', 'job1');
const job = await redis.rpop('queue');

// Sets
await redis.sadd('tags', 'tag1', 'tag2');
const tags = await redis.smembers('tags');

// Get info
const info = await redis.info();
```

### Prisma Adapter

**Features:**
- Universal ORM for any database
- Type-safe queries
- Auto-generated client
- Migration support

**Setup:**
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

**Environment:**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
```

**Usage:**
```javascript
const prisma = manager.get('prisma');

// Query
const users = await prisma.user.findMany();

// Create
const user = await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' }
});

// Update
await prisma.user.update({
  where: { id: user.id },
  data: { name: 'Jane' }
});
```

### Neo4j Adapter

**Features:**
- Cypher query support
- Graph traversal
- ACID transactions
- Bolt protocol

**Setup:**
```bash
npm install neo4j-driver
```

**Environment:**
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret
```

**Usage:**
```javascript
const neo4j = manager.get('neo4j');
const session = neo4j.session();

try {
  // Create node
  await session.run(`
    CREATE (u:User {name: $name, email: $email})
    RETURN u
  `, { name: 'John', email: 'john@example.com' });
  
  // Query
  const result = await session.run(`
    MATCH (u:User)
    RETURN u
    LIMIT 10
  `);
  
  console.log(result.records);
} finally {
  await session.close();
}
```

### DynamoDB Adapter

**Features:**
- AWS SDK v3 support
- Local DynamoDB support
- Document client
- Batch operations
- Table creation with GSI support

**Setup:**
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

**Environment:**
```bash
# Local DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy

# AWS Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Usage:**
```javascript
const dynamo = manager.get('dynamodb');

// Create table (idempotent - skips if exists)
await dynamo.createTable({
  tableName: 'Users',
  keySchema: [
    { attributeName: 'pk', keyType: 'HASH' },
    { attributeName: 'sk', keyType: 'RANGE' }
  ],
  attributeDefinitions: [
    { attributeName: 'pk', attributeType: 'S' },
    { attributeName: 'sk', attributeType: 'S' },
    { attributeName: 'email', attributeType: 'S' }
  ],
  billingMode: 'PAY_PER_REQUEST',
  globalSecondaryIndexes: [
    {
      indexName: 'EmailIndex',
      keySchema: [{ attributeName: 'email', keyType: 'HASH' }],
      projectionType: 'ALL'
    }
  ]
});

// Put item
await dynamo.put('Users', {
  pk: 'USER#123',
  sk: 'PROFILE#123',
  name: 'John',
  email: 'john@example.com'
});

// Get item
const result = await dynamo.get('Users', {
  pk: 'USER#123',
  sk: 'PROFILE#123'
});

// Query with GSI
const users = await dynamo.query('Users', {
  index: 'EmailIndex',
  keyCondition: 'email = :email',
  values: { ':email': 'john@example.com' }
});

// Scan
const allUsers = await dynamo.scan('Users', { limit: 100 });
```

## Database Helpers

### Get Statistics

```javascript
const { helpers } = await initDatabases();

// Get stats for all databases
const stats = await helpers.getDBStats();
// Returns:
// {
//   mongodb: { status: 'connected', collections: 5, documents: 1500 },
//   redis: { status: 'connected', keys: 250, memory: '1.5MB' },
//   postgresql: { status: 'connected', tables: 10 }
// }
```

## Environment Configuration Reference

### MongoDB
```bash
MONGODB_URI=mongodb://localhost:27017/myapp
# or
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=myapp
MONGODB_USER=admin
MONGODB_PASS=secret
```

### PostgreSQL
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
# or
PGHOST=localhost
PGPORT=5432
PGDATABASE=myapp
PGUSER=user
PGPASSWORD=pass
```

### MySQL
```bash
DATABASE_URL=mysql://user:pass@localhost:3306/myapp
# or
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=myapp
MYSQL_USER=user
MYSQL_PASSWORD=pass
```

### Redis
```bash
REDIS_URL=redis://localhost:6379
# or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=pass
REDIS_DB=0
```

### Neo4j
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret
```

### DynamoDB
```bash
# Local
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Connection Pooling

All database adapters support connection pooling:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/myapp?maxPoolSize=50

# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost/myapp?pool_size=20

# MySQL
DATABASE_URL=mysql://user:pass@localhost/myapp?connectionLimit=20

# Redis (handled by ioredis)
REDIS_URL=redis://localhost:6379
```

## Error Handling

```javascript
try {
  const { manager, helpers } = await initDatabases();
} catch (error) {
  console.error('Database connection failed:', error.message);
}

// Check status before operations
if (manager.isConnected('mongodb')) {
  const mongo = manager.get('mongodb');
  // ... use mongo
}
```

## Best Practices

1. **Use environment variables** - Don't hardcode credentials
2. **Connection pooling** - Configure appropriate pool sizes
3. **Check status** - Verify connections before operations
4. **Close properly** - Close connections on application shutdown
5. **Use SSL in production** - Enable SSL for remote connections

## Multiple Databases Example

```javascript
// .nodesh.js
module.exports = {
  context: {
    async getAllStats() {
      const { helpers } = await initDatabases();
      return helpers.getDBStats();
    },
    
    async clearAllCaches() {
      const manager = getConnectionManager();
      const redis = manager.get('redis');
      await redis.flushAll();
    }
  }
};
```
