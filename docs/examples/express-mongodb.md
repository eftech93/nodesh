# Express + MongoDB Example

Complete example of using NodeSH with an Express.js and MongoDB application.

## Project Structure

```
example/
├── src/
│   ├── app.js                 # Express application setup
│   ├── server.js              # Server entry point
│   ├── models/
│   │   ├── User.js            # Mongoose User model
│   │   ├── Order.js           # Mongoose Order model
│   │   └── Product.js         # Mongoose Product model
│   ├── services/
│   │   ├── userService.js     # User business logic
│   │   ├── orderService.js    # Order business logic
│   │   ├── productService.js  # Product business logic
│   │   └── cacheService.js    # Redis cache service
│   ├── routes/
│   │   ├── users.js           # User routes
│   │   ├── orders.js          # Order routes
│   │   └── products.js        # Product routes
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis connection
│   │   └── queue.js           # BullMQ setup
│   └── jobs/
│       ├── emailJob.js        # Email processing job
│       └── reportJob.js       # Report generation job
├── docker-compose.yml         # MongoDB, Redis services
├── package.json
└── .nodesh.js                 # NodeSH configuration
```

## Setup

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Redis on port 6379
- Redis Commander on port 8081

### 2. Install Dependencies

```bash
npm install
```

### 3. Start NodeSH

```bash
npm run console

# Or directly
nodesh --yes
```

## Using NodeSH

### User Operations

```javascript
// Create a user
express> await userService.create({
...   email: 'alice@example.com',
...   password: 'password123',
...   name: { first: 'Alice', last: 'Smith' },
...   role: 'customer'
... })

// Find users
express> await userService.findActive()
express> await userService.findByEmail('alice@example.com')

// Update user
express> await userService.update(userId, {
...   name: { first: 'Alice', last: 'Johnson' }
... })

// Authenticate
express> await userService.authenticate(
...   'alice@example.com',
...   'password123'
... )
```

### Order Operations

```javascript
// Create an order
express> await orderService.create(
...   userId,
...   [
...     { productId: 'prod1', quantity: 2, price: 29.99 },
...     { productId: 'prod2', quantity: 1, price: 49.99 }
...   ],
...   {
...     street: '123 Main St',
...     city: 'New York',
...     zipCode: '10001'
...   }
... )

// Get user orders
express> await orderService.findByUserId(userId)

// Update status
express> await orderService.updateStatus(orderId, 'shipped')

// Cancel order
express> await orderService.cancel(orderId)
```

### Product Operations

```javascript
// Create products
express> await productService.create({
...   name: 'Wireless Headphones',
...   sku: 'WH-001',
...   price: 79.99,
...   stock: 100,
...   category: 'electronics'
... })

// Search products
express> await productService.search('headphones')

// Check stock
express> await productService.checkStock(productId, 5)

// Update stock
express> await productService.updateStock(productId, -2)  // Decrease by 2
```

### Cache Operations

```javascript
// Set cache
express> await cacheService.set('user:123', userData, 3600)

// Get cache
express> await cacheService.get('user:123')

// Delete cache
express> await cacheService.del('user:123')

// Get cache stats
express> await cacheService.getStats()
```

### Queue Operations

```javascript
// Add email job
express> await queueService.add('email', {
...   to: 'user@example.com',
...   subject: 'Welcome!',
...   template: 'welcome',
...   data: { name: 'John' }
... })

// Add report job
express> await queueService.add('report', {
...   type: 'monthly-sales',
...   month: '2024-01'
... })

// Check queue status
express> await queueService.getAllStatuses()
```

## Advanced Usage

### Bulk Operations

```javascript
// Seed multiple users
express> const { seedUsers } = require('@eftech93/nodesh')
express> await seedUsers({
...   count: 50,
...   create: (data) => userService.create(data),
...   roles: ['customer', 'admin', 'manager']
... })

// Batch order creation
express> const { batch } = require('@eftech93/nodesh')
express> await batch([
...   () => orderService.create(user1, items1, address1),
...   () => orderService.create(user2, items2, address2),
...   () => orderService.create(user3, items3, address3),
... ], { concurrency: 2 })
```

### Performance Testing

```javascript
// Measure query performance
express> const { measure } = require('@eftech93/nodesh')
express> await measure(() => 
...   Order.find().populate('user').populate('items.product')
... )

// Run with logging
express> const { run } = require('@eftech93/nodesh')
express> await run(
...   () => Product.find({ category: 'electronics' }),
...   'Find electronics'
... )
```

### Statistics

```javascript
// Show database stats
express> const { showStats } = require('@eftech93/nodesh')
express> await showStats({
...   users: () => User.countDocuments(),
...   orders: () => Order.countDocuments(),
...   products: () => Product.countDocuments(),
...   revenue: async () => {
...     const result = await Order.aggregate([
...       { $match: { status: 'completed' } },
...       { $group: { _id: null, total: { $sum: '$total' } } }
...     ])
...     return result[0]?.total || 0
...   }
... })
```

### API Testing

```javascript
// Test API directly
express> const { http, debugApi } = require('@eftech93/nodesh')
express> http.defaults.baseURL = 'http://localhost:3000/api'

// Get users
express> await http.get('/users')

// Create user
express> await http.post('/users', {
...   email: 'test@test.com',
...   password: 'password123',
...   name: { first: 'Test', last: 'User' }
... })

// Debug API call
express> await debugApi('/api/users', 'GET')
```

## Troubleshooting

### MongoDB Connection Issues

```javascript
// Check connection
express> mongoose.connection.readyState
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

// Reconnect
express> await mongoose.connect(process.env.MONGODB_URI)
```

### Redis Connection Issues

```javascript
// Check Redis
express> await cacheService.ping()

// Reconnect
express> await cacheService.connect()
```

### Reload After Changes

```javascript
express> .reload
```

## Complete Session Example

```bash
$ cd example
$ npm run docker:up
$ npm run console

╔════════════════════════════════════════╗
║           NodeSH (nodesh)              ║
║    Interactive shell for Node.js apps  ║
╚════════════════════════════════════════╝

Loading application...
✓ Loaded 15 files

Available context:
  Models: User, Order, Product
  Services: userService, orderService, productService, cacheService, queueService

express> // Create users
express> const admin = await userService.create({
...   email: 'admin@example.com',
...   password: 'admin123',
...   name: { first: 'Admin', last: 'User' },
...   role: 'admin'
... })

express> const customer = await userService.create({
...   email: 'customer@example.com',
...   password: 'customer123',
...   name: { first: 'John', last: 'Doe' },
...   role: 'customer'
... })

express> // Create products
express> const product = await productService.create({
...   name: 'Laptop',
...   sku: 'LAPTOP-001',
...   price: 999.99,
...   stock: 50,
...   category: 'electronics'
... })

express> // Create order
express> const order = await orderService.create(
...   customer._id,
...   [{ productId: product._id, quantity: 1, price: product.price }],
...   { street: '123 Main St', city: 'NYC', zipCode: '10001' }
... )

express> // Check stats
express> await showStats({
...   users: () => User.countDocuments(),
...   orders: () => Order.countDocuments(),
...   products: () => Product.countDocuments()
... })

express> .exit
```

## Related Documentation

- [Express Guide](../guides/express.md)
- [Database Support](../guides/database.md)
- [Testing Helpers](../guides/testing-helpers.md)
