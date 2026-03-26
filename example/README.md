# Express Example - Node Console

A complete Express.js application with MongoDB, Redis, and BullMQ integration.

## Features

- ✅ **MongoDB** - User, Order, and Product models with Mongoose
- ✅ **Redis** - Caching layer for performance
- ✅ **BullMQ** - Job queues for emails and notifications
- ✅ **REST API** - Full CRUD endpoints
- ✅ **Console Ready** - Test everything via node-console

## Quick Start

### 1. Start Infrastructure

```bash
# Start MongoDB and Redis
docker-compose -f ../docker-compose.yml up -d

# Or using npm script
npm run docker:up
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (default values work with docker-compose)
```

### 4. Start the Server (optional)

```bash
npm start
# Server runs on http://localhost:3000
# Health check: http://localhost:3000/health
```

### 5. Launch the Console

```bash
# Generate config and start console
npx node-console --yes

# Or if node-console is installed globally
node-console --yes

# Or use the shorter aliases:
ncon --yes    # 4 characters
nc --yes      # 2 characters
c --yes       # 1 character
```

## Console Examples

```javascript
// Create a user
express> const user = await UserService.create({
  email: 'alice@example.com',
  password: 'password123',
  name: { first: 'Alice', last: 'Smith' }
})

// Find user with caching
express> await UserService.findByEmail('alice@example.com')

// Get user stats
express> await UserService.getStats()

// Create a product
express> const product = await Product.create({
  sku: 'LAPTOP-001',
  name: 'MacBook Pro',
  description: '15-inch MacBook Pro',
  price: 1999.99,
  category: 'Electronics',
  inventory: { quantity: 10 }
})

// Create an order
express> const order = await OrderService.create(
  user._id,
  [{ productId: product._id, quantity: 2 }],
  { street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' }
)

// Check queue status
express> await QueueService.getAllStatuses()

// View recent jobs
express> await QueueService.getRecentJobs('email', 'completed', 5)

// Check cache stats
express> await CacheService.getStats()

// Clear user cache
express> await CacheService.invalidateUser(user._id)

// Get dashboard stats
express> await OrderService.getDashboardStats()

// Raw MongoDB queries
express> await User.find().limit(5)
express> await Order.findByStatus('pending')
express> await Product.findInStock()

// Redis operations
express> await CacheService.getKeys('user:*')
express> await redis.ping()
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/users | Create user |
| GET | /api/users | List users |
| GET | /api/users/:id | Get user |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order |
| PATCH | /api/orders/:id/status | Update order status |
| GET | /api/dashboard/stats | Dashboard stats |

## Project Structure

```
src/
├── config/
│   ├── database.js     # MongoDB connection
│   ├── redis.js        # Redis client
│   └── queue.js        # BullMQ queues
├── models/
│   ├── User.js         # User model
│   ├── Order.js        # Order model
│   ├── Product.js      # Product model
│   └── index.js        # Models export
├── services/
│   ├── UserService.js  # User business logic
│   ├── OrderService.js # Order business logic
│   ├── QueueService.js # Queue management
│   ├── CacheService.js # Cache operations
│   └── index.js        # Services export
└── app.js              # Express app
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & Queue |
| Redis Commander | 8081 | Redis UI (http://localhost:8081) |

## Stopping Infrastructure

```bash
npm run docker:down
# or
docker-compose -f ../docker-compose.yml down
```
