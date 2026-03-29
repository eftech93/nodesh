# Testing Helpers

NodeSH includes built-in utilities for testing, debugging, and timing operations.

## Timing Utilities

### run() - Run with Logging

Run a function with automatic timing and logging:

```javascript
const { run } = require('@eftech93/nodesh');

// Basic usage
await run(() => User.find(), 'Find all users');
// Output: ✓ Find all users (45ms)

// With parameters
await run(() => User.findById(id), 'Find user by ID');
```

### measure() - Measure Execution Time

Measure execution time without logging:

```javascript
const { measure } = require('@eftech93/nodesh');

const { result, duration } = await measure(() => heavyOperation());
console.log(`Operation took ${duration}ms`);
// Output: Operation took 1250ms

// Access result
console.log(result);
```

### batch() - Run Multiple Operations

Run multiple operations and measure total time:

```javascript
const { batch } = require('@eftech93/nodesh');

const results = await batch([
  () => User.findById('1'),
  () => User.findById('2'),
  () => User.findById('3'),
], { concurrency: 2 });

// Results array in same order
console.log(results[0]); // User 1
console.log(results[1]); // User 2
console.log(results[2]); // User 3
```

## API Testing

### http - Simple HTTP Client

```javascript
const { http } = require('@eftech93/nodesh');

// Configure base URL
http.defaults.baseURL = 'http://localhost:3000/api';

// GET request
const users = await http.get('/users');

// POST request
const newUser = await http.post('/users', {
  name: 'John',
  email: 'john@example.com'
});

// With query parameters
const filtered = await http.get('/users', {
  params: { active: true, page: 1 }
});

// PUT/PATCH/DELETE
await http.put('/users/123', { name: 'Jane' });
await http.patch('/users/123', { active: false });
await http.delete('/users/123');
```

### ApiTester Class

More structured API testing:

```javascript
const { ApiTester } = require('@eftech93/nodesh');

const api = new ApiTester('http://localhost:3000/api');

// Set default headers
api.setHeaders({
  'Authorization': 'Bearer token123',
  'Content-Type': 'application/json'
});

// GET with query
const users = await api.get('/users', { page: '1', limit: '10' });

// POST
const created = await api.post('/users', {
  name: 'John',
  email: 'john@example.com'
});

// Assert response
api.expectStatus(201);
api.expectBody({ name: 'John' });
```

### debugApi() - Step-by-Step Debugging

Debug API calls with detailed output:

```javascript
const { debugApi } = require('@eftech93/nodesh');

// Debug a single request
await debugApi('/api/users/123', 'GET');
// Shows:
// → Request: GET /api/users/123
// → Headers: { ... }
// ← Response: 200 OK (45ms)
// ← Body: { ... }

// With body
await debugApi('/api/users', 'POST', {
  name: 'John',
  email: 'john@example.com'
});
```

## Database Seeding

### seed() - Generic Seeding

```javascript
const { seed } = require('@eftech93/nodesh');

// Seed with custom creator
await seed({
  count: 100,
  create: (index) => User.create({
    name: `User ${index}`,
    email: `user${index}@test.com`,
    role: index % 2 === 0 ? 'user' : 'admin'
  }),
  batchSize: 10,  // Process in batches
  onProgress: (completed, total) => {
    console.log(`${completed}/${total} created`);
  }
});
// Output: ✓ Seeded 100 records in 2.5s
```

### seedUsers() - User Seeding

```javascript
const { seedUsers } = require('@eftech93/nodesh');

await seedUsers({
  count: 50,
  create: (data) => User.create(data),
  roles: ['user', 'admin', 'moderator'],
  password: 'password123'  // Default password for all
});
```

### clear() - Clear Data

```javascript
const { clear } = require('@eftech93/nodesh');

// Clear multiple collections
await clear([
  () => User.deleteMany({}),
  () => Order.deleteMany({}),
  () => Product.deleteMany({})
]);
// Output: ✓ Cleared 3 collections
```

### showStats() - Database Statistics

```javascript
const { showStats } = require('@eftech93/nodesh');

await showStats({
  users: () => User.countDocuments(),
  orders: () => Order.countDocuments(),
  products: () => Product.countDocuments(),
  revenue: async () => {
    const result = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result[0]?.total || 0;
  }
});
// Output:
// Database Statistics:
// ─────────────────────
// users:    150
// orders:   423
// products: 89
// revenue:  $15,420.00
```

## Formatting Utilities

### formatTable() - Format as Table

```javascript
const { formatTable } = require('@eftech93/nodesh');

const data = [
  { name: 'User', count: 100, active: 85 },
  { name: 'Order', count: 500, active: 450 },
  { name: 'Product', count: 50, active: 48 }
];

console.log(formatTable(data));
// Output:
// ┌─────────┬───────┬────────┐
// │ name    │ count │ active │
// ├─────────┼───────┼────────┤
// │ User    │ 100   │ 85     │
// │ Order   │ 500   │ 450    │
// │ Product │ 50    │ 48     │
// └─────────┴───────┴────────┘
```

### formatBytes() - Format Bytes

```javascript
const { formatBytes } = require('@eftech93/nodesh');

formatBytes(1024);        // "1 KB"
formatBytes(1048576);     // "1 MB"
formatBytes(1073741824);  // "1 GB"
formatBytes(1536);        // "1.5 KB"
```

### formatDuration() - Format Duration

```javascript
const { formatDuration } = require('@eftech93/nodesh');

formatDuration(500);      // "500ms"
formatDuration(5000);     // "5.00s"
formatDuration(120000);   // "2m 0.00s"
formatDuration(3600000);  // "1h 0m 0.00s"
```

## Complete Testing Workflow

```javascript
// In NodeSH shell

// 1. Clear existing data
node> await clear([() => User.deleteMany({}), () => Order.deleteMany({})])

// 2. Seed test data
node> await seedUsers({ count: 10, create: data => User.create(data) })

// 3. Run API tests
node> await debugApi('/api/users', 'GET')

// 4. Test specific endpoint
node> const response = await http.get('/api/users')
node> console.log(formatTable(response.data))

// 5. Check database state
node> await showStats({ users: () => User.countDocuments() })

// 6. Measure performance
node> await measure(() => User.find().populate('orders'))
```

## Best Practices

1. **Use batch() for bulk operations** - Better performance
2. **Use measure() to identify slow operations**
3. **Use debugApi() for troubleshooting**
4. **Seed before testing** - Ensure consistent test data
5. **Clear after testing** - Keep database clean
