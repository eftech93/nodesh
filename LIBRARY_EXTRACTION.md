# Library Extraction Guide

This document describes what has been extracted from the example projects into the core library (`/src`) for reuse across all projects.

## Moved to Library

### Generic Helpers (`src/helpers/`)

These are framework-agnostic and can be used with any Node.js application:

#### Timing Helpers (`timing-helper.ts`)
- `run()` - Execute with logging and timing
- `measure()` - Measure execution time
- `batch()` - Run multiple operations in parallel
- `retry()` - Retry with exponential backoff
- `sleep()` - Delay execution

#### API Testing Helpers (`api-helpers.ts`)
- `createMockRequest()` - Create mock request objects
- `createNextRequest()` - Create Next.js style requests
- `ApiTester` class - HTTP client for API testing
- `http` - Shorthand HTTP methods (get, post, patch, put, delete)
- `debugApi()` - Step-by-step API debugging

#### Seeding Helpers (`seed-helper.ts`)
- `seed()` - Generic database seeding
- `seedUsers()` - User seeding with fake data
- `clear()` - Clear database data
- `showStats()` - Show database statistics

### Next.js Specific Helpers (`src/helpers/nextjs-helpers.ts`)

These are for Next.js applications but still generic enough to be in the library:

#### Core Next.js Helpers
- `createNextAppRouterRequest()` - Create Next.js App Router compatible requests
- `callNextRoute()` - Call API route handlers directly

#### API Route Helpers (NEW - Now in Library)
- `api(rootPath, path, method, body, options)` - Generic API caller for Next.js App Router routes
  - `rootPath` - Base directory for API routes (e.g., `'./src/app/api'`)
  - `path` - API path (e.g., `'/users'` or `'/users/123'`)
  - `method` - HTTP method: `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'`
  - `body` - Request body (for POST/PUT/PATCH)
  - `options.query` - Query parameters
  - `options.headers` - Custom headers

- `apiHttp(rootPath)` - Factory function that returns HTTP method helpers:
  ```typescript
  const nextApi = apiHttp('./src/app/api');
  const users = await nextApi.get('/users');
  const newUser = await nextApi.post('/users', { name: 'John' });
  const updated = await nextApi.patch('/users/123', { name: 'Jane' });
  const replaced = await nextApi.put('/users/123', { name: 'Bob' });
  await nextApi.delete('/users/123');
  await nextApi.head('/users');
  await nextApi.options('/users');
  ```

- `nextApi` - Pre-configured for standard Next.js 14+ App Router structure (`./src/app/api`):
  ```typescript
  import { nextApi } from '@eftech93/nodesh';
  const users = await nextApi.get('/users');
  const newUser = await nextApi.post('/users', { name: 'John' });
  ```

#### Server Action Helpers
- `importServerActions()` - Import server action modules
- `execAction()` - Execute server actions with logging
- `batchActions()` - Batch execute multiple server actions

#### Dev Server Helpers
- `nextFetch()` - Fetch against running Next.js dev server

### Database Adapters (`src/database/adapters/`)

Multi-database support with unified interfaces:

- `MongoDBAdapter` + `createMongoDBConnectionFromEnv()`
- `PostgreSQLAdapter` + `createPostgreSQLConnectionFromEnv()`
- `MySQLAdapter` + `createMySQLConnectionFromEnv()`
- `RedisAdapter` + `createRedisConnectionFromEnv()`
- `PrismaAdapter` + `createPrismaConnectionFromEnv()`
- `Neo4jAdapter` + `createNeo4jConnectionFromEnv()`
- `DynamoDBAdapter` + `createDynamoDBConnectionFromEnv()`

### Utilities (`src/utils/`)

- `formatTable()` - Format data as ASCII table
- `formatBytes()` - Format bytes to human readable
- `formatDuration()` - Format milliseconds to readable duration
- `parseQuery()` - Parse query strings
- `buildQuery()` - Build query strings
- `safeJsonParse()` - Safe JSON parsing
- `safeJsonStringify()` - Safe JSON stringifying with circular ref handling

## Kept in Examples

These are example-specific and should remain in the example projects:

### Example-Specific Helpers (`example-nextjs/lib/console-helpers.ts`)

- `exampleApi()` - Pre-configured `api()` with example's root path (`./src/app/api`)
- `exampleHttp` - Pre-configured `apiHttp('./src/app/api')`
- `connect()` - Example's database connection wrapper
- `ensureConnected()` - Example's connection state management
- `seed()` - Example-specific seeding (uses example's UserService)
- `clear()` - Example-specific clearing (uses example's models)
- `stats()` - Example-specific stats (uses example's services)
- `debugExampleApi()` - Example-specific API debugger

### Models & Services

All domain models and services remain in the examples:

- `User.ts`, `UserService.ts` - MongoDB/Mongoose
- `Product.ts` - PostgreSQL
- `Order.ts` - MySQL
- `SocialUser.ts` - Neo4j
- `DynamoUser.ts` - DynamoDB

### API Routes & Server Actions

All application-specific routes and actions remain in examples:

- `app/api/*/route.ts` - API route handlers
- `lib/actions/*.actions.ts` - Server actions

## Usage Pattern

### Using Library Helpers

```typescript
// Import from library for generic helpers
import { 
  run, batch, http, debugApi,
  api, apiHttp, nextApi,  // API helpers
  callNextRoute, importServerActions, execAction 
} from '@eftech93/nodesh';

// Use nextApi for standard Next.js projects
const users = await nextApi.get('/users');
const user = await nextApi.post('/users', { name: 'John' });

// Use api() with custom root path for non-standard structures
const result = await api('./app/api', '/users', 'GET');

// Use apiHttp() for cleaner syntax
const myApi = apiHttp('./app/api');
const users = await myApi.get('/users');
```

### Creating Example-Specific Wrappers

```typescript
// lib/console-helpers.ts in your example
import { api, apiHttp } from '@eftech93/nodesh';

// Pre-configured for your project's structure
export const myApi = (path: string, method?: any, body?: any, options?: any) =>
  api('./src/app/api', path, method, body, options);

export const myHttp = apiHttp('./src/app/api');
```

## Migration Checklist

When building a new example:

1. **Use library helpers** for:
   - Timing operations (`run`, `measure`, `batch`)
   - HTTP testing (`http`, `nextFetch`, `ApiTester`)
   - API route testing (`api`, `apiHttp`, `nextApi`, `callNextRoute`)
   - Database seeding patterns (`seedUsers` as reference)
   - Database connections (adapters from library)

2. **Create example-specific** versions for:
   - Domain models (User, Product, Order, etc.)
   - API routes (`app/api/*/route.ts`)
   - Server actions (`lib/actions/*.actions.ts`)
   - Seed/clear/stats functions (using your models)
   - Pre-configured API wrappers with your root path

3. **Wrapper functions** (optional):
   - Create thin wrappers in `lib/console-helpers.ts` that:
     - Import from library
     - Add example-specific configuration (e.g., `rootPath`)
     - Re-export for convenience

## Benefits

1. **DRY** - Don't repeat generic code across examples
2. **Consistency** - All examples use the same helper patterns
3. **Maintainability** - Fix bugs in one place (the library)
4. **Documentation** - Library helpers are documented and tested
5. **Flexibility** - Examples can still customize where needed
6. **Full HTTP Support** - All REST methods including HEAD and OPTIONS
