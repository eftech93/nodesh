# NodeSH

An interactive shell for Node.js applications. Works with **Express**, **NestJS**, and any Node.js framework. Load your entire app context—models, services, configs, databases—and interact with them in a REPL with autocompletion.

Built with TypeScript for full type safety.

![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- 🚀 **Framework Agnostic** - Works with Express, NestJS, or vanilla Node.js
- 🔄 **Auto-Detection** - Automatically detects Express vs NestJS projects
- 📦 **Auto-Loading** - Automatically loads models, services, config files
- 🎯 **Intelligent Autocompletion** - Deep tab completion for object properties, methods, and prototype chains
  - Completes instance methods: `userService.findById`, `orderService.create`
  - Completes static methods: `User.find`, `User.create`
  - Completes nested properties: `config.database.url`
  - Discovers inherited methods from prototype chains
- 🔍 **Object Introspection** - Built-in helper methods to explore objects
  - `info(obj)` - Get detailed metadata about any object
  - `methods(obj)` - List all methods of an object
  - `props(obj)` - List all properties of an object
  - `type(obj)` - Get the type of an object
- 🔄 **Hot Reload** - Reload your app without restarting the shell
- 🎨 **Syntax Highlighting** - Colorized output for better readability
- 📜 **Command History** - Persistent history across sessions
- 🔷 **Full TypeScript Support** - Written in TypeScript, includes type definitions
- 🔧 **Customizable** - Configure via `.nodesh.js` or `package.json`
- 🗄️ **Multi-Database Support** - 7+ databases supported:
  - 🍃 **MongoDB** (Mongoose)
  - 🐘 **PostgreSQL** (pg)
  - 🐬 **MySQL** (mysql2)
  - ⚡ **Redis** (ioredis)
  - 📊 **Prisma** (Universal ORM)
  - 🕸️ **Neo4j** (Graph Database)
  - 📦 **DynamoDB** (AWS)
- 🌐 **API Client** - Built-in HTTP client for testing external and local APIs
- 📬 **Queue Management** - Full BullMQ/Bull queue control (pause, resume, retry, clean)
- 🧪 **Testing Helpers** - API testing, seeding, timing utilities built-in

## Installation

### Global Install (Recommended)

```bash
npm install -g @eftech93/nodesh
```

Then use it with any project:

```bash
cd my-project
nodesh --yes

# Or use the shorter aliases:
nsh --yes     # 3 characters
eft --yes     # EFTECH93 brand
```

### Local Install (Per Project)

```bash
npm install --save-dev @eftech93/nodesh
```

## Quick Start

### 1. Start Your Infrastructure

If using MongoDB/Redis (see examples):

```bash
docker-compose -f docker-compose.yml up -d
```

### 2. Launch the Shell

```bash
# Auto-detects Express or NestJS
cd my-project
nodesh

# Auto-generate config on first run
nodesh --yes

# Shorter aliases (all do the same thing):
nsh --yes     # 3 characters - shortest!
eft --yes     # EFTECH93 brand
```

### 3. Start Coding

```javascript
// Query database
node> await User.find({ isActive: true })

// Use services
node> await userService.create({ email: 'test@example.com' })

// Check cache
node> await cacheService.getStats()

// View queues
node> await queueService.getAllStatuses()

// Make HTTP requests
node> await apiService.get('https://api.example.com/users')
node> await apiService.local('GET', '/users')

// Reload after code changes
node> .reload
```

## Auto-Configuration

On first run, `nodesh` automatically:

1. **Detects your framework** (Express or NestJS)
2. **Detects TypeScript** (checks for `tsconfig.json`)
3. **Generates appropriate config** (`.nodesh.js`)

| Detected | Prompt | Entry Point |
|----------|--------|-------------|
| Express | `express>` | `src/app.js` |
| NestJS | `nest>` | `src/main.ts` |
| TypeScript | Same | `.ts` extensions |

## Configuration

### Via `.nodesh.js`

```javascript
module.exports = {
  // Path to your app entry file
  appEntry: 'src/app.js',
  
  // Directories to auto-load
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  helpersDir: 'helpers',
  configDir: 'config',
  
  // REPL settings
  prompt: 'myapp> ',
  useColors: true,
  historyFile: '~/.myapp_history',
  
  // Custom context
  context: {
    db: require('./src/database'),
    redis: require('./src/redis'),
  }
};
```

### Via `package.json`

```json
{
  "nodesh": {
    "appEntry": "src/server.js",
    "prompt": "api> ",
    "useColors": true
  }
}
```

## Shell Commands

Type these in the shell (with the `.` prefix):

| Command | Description |
|---------|-------------|
| `.reload` | Reload all application files |
| `.routes` | List all Express routes |
| `.models` | Show loaded models |
| `.services` | List loaded services |
| `.config` | Display configuration |
| `.env` | Show environment variables |
| `.clear` | Clear screen |
| `.help` | Show help |
| `.exit` | Exit shell |

## CLI Options

```bash
nodesh [path] [options]

Options:
  -e, --entry <file>      Path to app entry file
  -r, --root <path>       Project root directory
  --no-color              Disable colored output
  -p, --prompt <string>   REPL prompt string
  --env <environment>     Set NODE_ENV (default: development)
  --nestjs                Force NestJS mode detection
  --express               Force Express mode (skip NestJS detection)
  --init                  Create config file (auto-detects type)
  -y, --yes               Auto-generate config if not found
  -h, --help              Display help
  -V, --version           Display version
```

## Library Features

### 🗄️ Multi-Database Support

NodeSH includes a **unified database connection manager** supporting 7+ databases with automatic detection from environment variables:

| Database | Type | Adapter | Environment Variable |
|----------|------|---------|---------------------|
| 🍃 MongoDB | Document | mongoose | `MONGODB_URI` |
| 🐘 PostgreSQL | Relational | pg | `DATABASE_URL` or `PGHOST` |
| 🐬 MySQL | Relational | mysql2 | `DATABASE_URL` or `MYSQL_HOST` |
| ⚡ Redis | Key-Value | ioredis | `REDIS_URL` or `REDIS_HOST` |
| 📊 Prisma | Universal ORM | @prisma/client | `DATABASE_URL` |
| 🕸️ Neo4j | Graph | neo4j-driver | `NEO4J_URI` |
| 📦 DynamoDB | NoSQL | aws-sdk | `AWS_REGION` |

**Quick Start:**

```javascript
const { initDatabases, getConnectionManager } = require('@eftech93/nodesh');

// Auto-detect and connect all configured databases
const { manager, helpers } = await initDatabases();

// Access any connection
const mongo = manager.get('mongodb');
const postgres = manager.get('postgresql');
const redis = manager.get('redis');
const neo4j = manager.get('neo4j');
const dynamo = manager.get('dynamodb');
const prisma = manager.get('prisma');

// Get stats for all databases
await helpers.getDBStats();
```

**DynamoDB Table Creation:**

```javascript
const dynamo = manager.get('dynamodb');

// Create table with GSI support
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
```

**In the NodeSH Shell:**

```javascript
// MongoDB operations
node> await User.find({ isActive: true })
node> await User.countDocuments()

// Redis operations  
node> await cacheService.get('user:123')
node> await cacheService.set('user:123', user, 3600)

// PostgreSQL queries
node> const result = await pg.query('SELECT * FROM users WHERE active = $1', [true])
```

See [Database Guide](https://eftech93.github.io/nodesh/#/guides/database) for detailed configuration.

### Testing Helpers

Built-in utilities for testing and debugging:

```javascript
// Timing operations
const { run, measure, batch } = require('@eftech93/nodesh');

await run(() => User.find(), 'Find all users');
const { result, duration } = await measure(() => heavyOperation());

// Run multiple operations
await batch([
  () => User.findById('1'),
  () => User.findById('2'),
  () => User.findById('3'),
]);
```

### API Testing

Test API routes directly in the console:

```javascript
const { http, ApiTester, debugApi } = require('@eftech93/nodesh');

// Simple HTTP calls
await http.get('/api/users');
await http.post('/api/users', { name: 'John', email: 'john@example.com' });

// Using ApiTester class
const api = new ApiTester('http://localhost:3000/api');
await api.get('/users', { page: '1', limit: '10' });

// Debug API calls step-by-step
await debugApi('/api/users/123', 'GET');
```

### Database Seeding

Built-in seeding utilities:

```javascript
const { seed, seedUsers, clear, showStats } = require('@eftech93/nodesh');

// Generic seeding
await seed({
  count: 100,
  create: (i) => User.create({ name: `User ${i}`, email: `user${i}@test.com` }),
  batchSize: 10,
});

// User seeding with fake data
await seedUsers({
  count: 50,
  create: (data) => User.create(data),
  roles: ['user', 'admin'],
});

// Show database stats
await showStats({
  users: () => User.countDocuments(),
  orders: () => Order.countDocuments(),
});

// Clear all data
await clear([
  () => User.deleteMany({}),
  () => Order.deleteMany({}),
]);
```

### Formatting Utilities

```javascript
const { formatTable, formatBytes, formatDuration } = require('@eftech93/nodesh');

// Format as table
console.log(formatTable([
  { name: 'User', count: 100 },
  { name: 'Order', count: 500 },
]));

// Format bytes
formatBytes(1024);        // "1 KB"
formatBytes(1048576);     // "1 MB"

// Format duration
formatDuration(500);      // "500ms"
formatDuration(5000);     // "5.00s"
formatDuration(120000);   // "2m 0.00s"
```

### 🌐 API Client

Built-in HTTP client for testing APIs directly in the console:

```javascript
// Configure base URL
apiService.setBaseURL('https://api.example.com')

// Make HTTP requests
const users = await apiService.get('/users')
const user = await apiService.get('/users/1')
const newUser = await apiService.post('/users', { name: 'John', email: 'john@example.com' })
const updated = await apiService.put('/users/1', { name: 'Jane' })
const deleted = await apiService.delete('/users/1')

// Test connectivity
const ping = await apiService.ping('https://api.example.com/health')
// => { success: true, latency: 45, status: 200 }

// Call your own API (auto-uses localhost:3000)
const localUsers = await apiService.local('GET', '/users')
const newOrder = await apiService.local('POST', '/orders', { productId: '123', quantity: 2 })
```

### 📬 Queue Management

Full queue control for BullMQ/Bull queues:

```javascript
// Get all queue statuses
await queueDashboardController.getAllQueueStatuses()

// Pause/Resume queues
await queueDashboardController.pauseQueue('email')
await queueDashboardController.resumeQueue('email')

// Get jobs with status filtering
await queueDashboardController.getJobs('email', 'failed')
await queueDashboardController.getJobs('email', 'waiting', 0, 19)

// Retry failed jobs
await queueDashboardController.retryJob('email', 'job-id-123')

// Retry all failed jobs
const failed = await queueDashboardController.getJobs('email', 'failed')
for (const job of failed) {
  await queueDashboardController.retryJob('email', job.id)
}

// Clean old jobs
await queueDashboardController.cleanQueue('email', 'completed', 100)

// Schedule job for future
await queueDashboardController.scheduleJob(
  'email',
  'send-welcome',
  { to: 'user@example.com' },
  new Date(Date.now() + 60000)  // 1 minute from now
)

// Get queue metrics
await queueDashboardController.getQueueMetrics('email')
```

## Examples

### Express + MongoDB + Redis + BullMQ

See `example/` directory for a complete Express application with:
- MongoDB (Mongoose)
- Redis (caching)
- BullMQ (job queues)
- Full CRUD services

```bash
cd example
npm install
npm run docker:up
npm run console
```

### NestJS + MongoDB + Redis + BullMQ

See `example-nestjs/` directory for a complete NestJS application with:
- MongoDB (Mongoose)
- Redis (caching)
- BullMQ (queues with processors)
- Full feature modules

```bash
cd example-nestjs
npm install
npm run docker:up
npm run build
npm run console
```

## Intelligent Autocomplete

The shell provides intelligent autocompletion for exploring your application's objects:

```javascript
// Press TAB after the dot to see available methods
node> userService.<TAB>
// Shows: create, findById, findByEmail, findActive, update, delete, authenticate, getStats, clearCache

// Partial completion - type a few letters and press TAB
node> userService.find<TAB>
// Shows: findById, findByEmail, findActive

// Static/class methods on models
node> User.<TAB>
// Shows: find, findOne, findById, create, updateOne, deleteOne, countDocuments

// Deep nested property access
node> config.database.<TAB>
// Shows: url, host, port, name

// Array/Collection methods
node> users.map<TAB>
// Shows: map, filter, reduce, forEach, find, etc.
```

### Object Introspection Helpers

Special helper functions are available in the shell to explore objects:

```javascript
// Get detailed information about any object
node> info(userService)
// Returns:
// {
//   name: 'userService',
//   type: 'UserService',
//   constructor: 'UserService',
//   properties: [...],
//   methods: [...]
// }

// List all methods of an object
node> methods(userService)
// Returns: ['create', 'findById', 'findByEmail', 'findActive', 'update', 'delete', ...]

// List all properties (non-methods) of an object
node> props(config)
// Returns: ['env', 'port', 'database', 'redis', 'jwt']

// Get the type of any value
node> type(userService)
// Returns: 'UserService'

node> type(User)
// Returns: 'Object' or the class name
```

## Shell Session Examples

### Express Example

```javascript
express> await UserService.create({
  email: 'alice@example.com',
  password: 'password123',
  name: { first: 'Alice', last: 'Smith' }
})

express> const user = await UserService.findByEmail('alice@example.com')
express> await OrderService.create(user._id, items, shippingAddress)
express> await QueueService.getAllStatuses()
express> await CacheService.getStats()
```

### NestJS Example

```javascript
nest> const user = await usersService.create({
  email: 'bob@example.com',
  password: 'password123',
  name: { first: 'Bob', last: 'Jones' }
})

nest> await usersService.findById(user._id.toString())
nest> await ordersService.create(user._id.toString(), items, address)
nest> await queuesService.getAllStatuses()
nest> await cacheService.getStats()
```

## Global Installation Guide

When installed globally (`npm install -g @eftech93/nodesh`), you can use it with any project:

```bash
# Navigate to any project
cd ~/projects/my-api

# Run shell (auto-detects project type)
nodesh

# Auto-generate config on first run
nodesh --yes
```

## TypeScript Usage

The library is written in TypeScript and includes full type definitions.

```typescript
import { ExpressConsole, AppLoader } from '@eftech93/nodesh';

async function startConsole(): Promise<void> {
  const console = new ExpressConsole({
    rootPath: __dirname,
    appEntry: 'app.ts',
    prompt: 'dev> '
  });

  await console.start();
}
```

## Programmatic API

### Using the Intelligent Completer

You can use the autocomplete functionality in your own code:

```typescript
import { IntelligentCompleter } from '@eftech93/nodesh';

const context = {
  userService: new UserService(),
  orderService: new OrderService()
};

const completer = new IntelligentCompleter(context);

// Get completions for a partial input
const [completions] = completer.complete('userService.find');
console.log(completions); // ['findById', 'findByEmail', 'findActive']

// Introspect an object
const metadata = completer.introspect('userService');
console.log(metadata.properties);
console.log(metadata.type);
console.log(metadata.constructor);

// Get type information
const type = completer.getTypeName(context.userService);
console.log(type); // 'UserService'
```

### Creating Custom REPL with Autocomplete

```typescript
import { createCompleter, addIntrospectionMethods } from '@eftech93/nodesh';
import repl from 'repl';

const context = {
  myService: new MyService()
};

const replServer = repl.start({
  prompt: 'myapp> ',
  completer: createCompleter(context)
});

// Add introspection helpers
addIntrospectionMethods(replServer.context);
Object.assign(replServer.context, context);
```

## Development

### Running Tests

The library includes comprehensive unit tests and integration tests using Jest:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Integration Tests

Integration tests verify the CLI works with real projects and databases:

```bash
# Start test databases (Docker required)
npm run test:docker:up

# Run all integration tests
npm run test:integration

# Run specific integration tests
npm run test:integration:nextjs
npm run test:integration:nestjs
npm run test:integration:express

# Stop test databases
npm run test:docker:down
```

Test infrastructure includes 6 databases running on custom ports:
- MongoDB (port 9000)
- Redis (port 9001)
- PostgreSQL (port 9002)
- MySQL (port 9003)
- Neo4j (ports 9004/9005)
- DynamoDB Local (port 9006)

### Test Structure

Tests are organized in the `tests/` directory:

- `autocomplete.test.ts` - Tests for intelligent autocomplete functionality
- `config.test.ts` - Tests for configuration loading
- `loader.test.ts` - Tests for application loading
- `console.test.ts` - Tests for the main console class
- `types.test.ts` - Tests for TypeScript type definitions
- `integration/` - Integration tests with real projects and databases

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## Troubleshooting

### MongoDB/Redis Connection Issues

Make sure your infrastructure is running:

```bash
docker-compose up -d
```

### Module Not Found

The shell will show warnings but continue. Fix paths in `.nodesh.js`:

```javascript
module.exports = {
  modelsDir: 'dist/models',  // For compiled TS
  servicesDir: 'dist/services'
};
```

### App Not Found

Specify the entry file explicitly:

```bash
nodesh --entry dist/main.js
```

## Docker Compose (For Examples)

Included `docker-compose.yml` provides:

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & Queue |
| Redis Commander | 8081 | Redis UI |

```bash
docker-compose up -d
docker-compose down
```

## Inspired By

- [Django Shell](https://docs.djangoproject.com/en/stable/ref/django-admin/#shell)
- [Django Shell](https://docs.djangoproject.com/en/stable/ref/django-admin/#shell)
- [Laravel Tinker](https://github.com/laravel/tinker)

## License

MIT
