# Helpers API

Built-in helpers for testing, timing, seeding, and API testing.

## Timing Helpers

### run()

Runs a function with automatic timing and logging.

```typescript
async function run<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<T>
```

**Parameters:**
- `fn` - Function to run
- `label` - Optional label for logging

**Returns:** Result of the function

**Example:**

```typescript
import { run } from '@eftech93/nodesh';

// Basic usage
const users = await run(() => User.find(), 'Find users');
// Output: ✓ Find users (45ms)

// Without label
const count = await run(() => User.countDocuments());
// Output: ✓ Operation completed (12ms)
```

### measure()

Measures execution time without logging.

```typescript
async function measure<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }>
```

**Parameters:**
- `fn` - Function to measure

**Returns:** Object with result and duration in milliseconds

**Example:**

```typescript
import { measure } from '@eftech93/nodesh';

const { result, duration } = await measure(() => heavyOperation());
console.log(`Took ${duration}ms`);
```

### batch()

Runs multiple operations with concurrency control.

```typescript
async function batch<T>(
  fns: Array<() => Promise<T> | T>,
  options?: { concurrency?: number }
): Promise<T[]>
```

**Parameters:**
- `fns` - Array of functions to run
- `options.concurrency` - Maximum concurrent operations (default: unlimited)

**Returns:** Array of results

**Example:**

```typescript
import { batch } from '@eftech93/nodesh';

const results = await batch([
  () => User.findById('1'),
  () => User.findById('2'),
  () => User.findById('3'),
], { concurrency: 2 });
```

## API Testing Helpers

### http

Simple HTTP client for API testing.

```typescript
const http: {
  defaults: {
    baseURL: string;
    headers: Record<string, string>;
  };
  get(url: string, config?: object): Promise<any>;
  post(url: string, data?: any, config?: object): Promise<any>;
  put(url: string, data?: any, config?: object): Promise<any>;
  patch(url: string, data?: any, config?: object): Promise<any>;
  delete(url: string, config?: object): Promise<any>;
}
```

**Example:**

```typescript
import { http } from '@eftech93/nodesh';

// Configure
http.defaults.baseURL = 'http://localhost:3000/api';

// GET
const users = await http.get('/users');

// With query params
const filtered = await http.get('/users', {
  params: { active: true }
});

// POST
const created = await http.post('/users', {
  name: 'John',
  email: 'john@example.com'
});

// PUT/PATCH/DELETE
await http.put('/users/123', { name: 'Jane' });
await http.patch('/users/123', { active: false });
await http.delete('/users/123');
```

### ApiTester

Structured API testing class.

```typescript
class ApiTester {
  constructor(baseURL: string);
  setHeaders(headers: Record<string, string>): void;
  get(url: string, params?: Record<string, string>): Promise<any>;
  post(url: string, data?: any): Promise<any>;
  put(url: string, data?: any): Promise<any>;
  patch(url: string, data?: any): Promise<any>;
  delete(url: string): Promise<any>;
  expectStatus(status: number): void;
  expectBody(expected: any): void;
}
```

**Example:**

```typescript
import { ApiTester } from '@eftech93/nodesh';

const api = new ApiTester('http://localhost:3000/api');

api.setHeaders({
  'Authorization': 'Bearer token123'
});

const users = await api.get('/users', { page: '1' });
api.expectStatus(200);
```

### debugApi()

Debugs API calls with detailed output.

```typescript
async function debugApi(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: any
): Promise<any>
```

**Example:**

```typescript
import { debugApi } from '@eftech93/nodesh';

await debugApi('/api/users/123', 'GET');
// Shows request/response details
```

## Seeding Helpers

### seed()

Generic data seeding utility.

```typescript
async function seed<T>(options: {
  count: number;
  create: (index: number) => Promise<T> | T;
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}): Promise<T[]>
```

**Example:**

```typescript
import { seed } from '@eftech93/nodesh';

await seed({
  count: 100,
  create: (i) => User.create({
    name: `User ${i}`,
    email: `user${i}@test.com`
  }),
  batchSize: 10,
  onProgress: (completed, total) => {
    console.log(`${completed}/${total}`);
  }
});
```

### seedUsers()

User-specific seeding utility.

```typescript
async function seedUsers(options: {
  count: number;
  create: (data: UserData) => Promise<any>;
  roles?: string[];
  password?: string;
}): Promise<any[]>
```

**Example:**

```typescript
import { seedUsers } from '@eftech93/nodesh';

await seedUsers({
  count: 50,
  create: (data) => User.create(data),
  roles: ['user', 'admin'],
  password: 'password123'
});
```

### clear()

Clears multiple collections.

```typescript
async function clear(
  operations: Array<() => Promise<any>>
): Promise<void>
```

**Example:**

```typescript
import { clear } from '@eftech93/nodesh';

await clear([
  () => User.deleteMany({}),
  () => Order.deleteMany({}),
  () => Product.deleteMany({})
]);
```

### showStats()

Shows database statistics.

```typescript
async function showStats(
  counters: Record<string, () => Promise<number> | number>
): Promise<void>
```

**Example:**

```typescript
import { showStats } from '@eftech93/nodesh';

await showStats({
  users: () => User.countDocuments(),
  orders: () => Order.countDocuments(),
  revenue: async () => {
    const result = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result[0]?.total || 0;
  }
});
```

## Complete Example

```typescript
import { 
  run, 
  measure, 
  batch,
  http,
  seed,
  clear,
  showStats 
} from '@eftech93/nodesh';

// Configure HTTP client
http.defaults.baseURL = 'http://localhost:3000/api';

async function runTests() {
  // Clear data
  await clear([
    () => User.deleteMany({}),
    () => Order.deleteMany({})
  ]);
  
  // Seed test data
  await seed({
    count: 10,
    create: (i) => User.create({
      name: `User ${i}`,
      email: `user${i}@test.com`
    })
  });
  
  // Test API
  const users = await run(
    () => http.get('/users'),
    'Fetch users'
  );
  
  // Measure performance
  const { duration } = await measure(
    () => User.find().populate('orders')
  );
  console.log(`Query took ${duration}ms`);
  
  // Show stats
  await showStats({
    users: () => User.countDocuments(),
    orders: () => Order.countDocuments()
  });
}

runTests();
```
