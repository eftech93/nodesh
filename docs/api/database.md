# Database API

API for managing database connections and operations.

## initDatabases()

Initializes all configured database connections.

```typescript
async function initDatabases(): Promise<{
  manager: ConnectionManager;
  helpers: DatabaseHelpers;
}>
```

**Returns:**
- `manager` - Connection manager instance
- `helpers` - Database helper functions

**Example:**

```typescript
import { initDatabases } from '@eftech93/nodesh';

const { manager, helpers } = await initDatabases();

// Get connection
const mongo = manager.get('mongodb');

// Get stats
const stats = await helpers.getDBStats();
```

## ConnectionManager

Manages all database connections.

### Methods

#### get()

Gets a specific database connection.

```typescript
get(name: DatabaseType): Connection
```

**Parameters:**
- `name` - Database type: `'mongodb'`, `'postgresql'`, `'mysql'`, `'redis'`, `'neo4j'`, `'dynamodb'`

**Returns:** Connection instance

**Example:**

```typescript
const mongo = manager.get('mongodb');
const redis = manager.get('redis');
const pg = manager.get('postgresql');
```

#### isConnected()

Checks if a database is connected.

```typescript
isConnected(name: DatabaseType): boolean
```

**Example:**

```typescript
if (manager.isConnected('mongodb')) {
  const mongo = manager.get('mongodb');
  // Use mongo
}
```

#### getAllStatuses()

Gets connection status for all databases.

```typescript
getAllStatuses(): Record<DatabaseType, ConnectionStatus>
```

**Example:**

```typescript
const statuses = manager.getAllStatuses();
console.log(statuses);
// {
//   mongodb: 'connected',
//   redis: 'connected',
//   postgresql: 'disconnected'
// }
```

#### close()

Closes a specific connection.

```typescript
async close(name: DatabaseType): Promise<void>
```

#### closeAll()

Closes all connections.

```typescript
async closeAll(): Promise<void>
```

## DatabaseHelpers

Helper functions for database operations.

### getDBStats()

Gets statistics for all connected databases.

```typescript
async function getDBStats(): Promise<DatabaseStats>
```

**Example:**

```typescript
const stats = await helpers.getDBStats();
console.log(stats);
// {
//   mongodb: {
//     status: 'connected',
//     collections: 5,
//     documents: 1500
//   },
//   redis: {
//     status: 'connected',
//     keys: 250,
//     memory: '1.5MB'
//   }
// }
```

## Database Types

### DatabaseType

```typescript
type DatabaseType = 
  | 'mongodb' 
  | 'postgresql' 
  | 'mysql' 
  | 'redis' 
  | 'neo4j' 
  | 'dynamodb' 
  | 'prisma';
```

### ConnectionStatus

```typescript
type ConnectionStatus = 'connected' | 'disconnected' | 'error';
```

## MongoDB Operations

```typescript
const mongo = manager.get('mongodb');

// Access Mongoose connection
const connection = mongo.connection;

// List collections
const collections = await connection.db.listCollections().toArray();

// Run command
await connection.db.admin().ping();

// Access models
const User = connection.model('User');
const users = await User.find();
```

## Redis Operations

```typescript
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

## PostgreSQL Operations

```typescript
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

## MySQL Operations

```typescript
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

## Prisma Operations

```typescript
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

## Neo4j Operations

```typescript
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

## DynamoDB Operations

```typescript
const dynamo = manager.get('dynamodb');

// Put item
await dynamo.put({
  TableName: 'Users',
  Item: {
    id: '123',
    name: 'John',
    email: 'john@example.com'
  }
}).promise();

// Get item
const result = await dynamo.get({
  TableName: 'Users',
  Key: { id: '123' }
}).promise();

// Scan
const scan = await dynamo.scan({
  TableName: 'Users'
}).promise();
```

## Environment Configuration

### MongoDB

```bash
MONGODB_URI=mongodb://localhost:27017/myapp
# or
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=myapp
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
