# NestJS Example - Node Console

A complete NestJS application with MongoDB, Redis, and BullMQ integration.

## Features

- ✅ **NestJS 10** - Modern Node.js framework with TypeScript
- ✅ **MongoDB** - With Mongoose ODM
- ✅ **Redis** - Caching and session storage
- ✅ **BullMQ** - Distributed job queues with processors
- ✅ **TypeScript** - Full type safety
- ✅ **Console Ready** - Test everything via node-console

## Quick Start

### 1. Start Infrastructure

```bash
# From the example-nestjs directory
npm run docker:up

# Or from the root node-console directory
docker-compose -f ../docker-compose.yml up -d
```

This starts:
- MongoDB on port 27017
- Redis on port 6379
- Redis Commander UI on port 8081

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (default values work with docker-compose)
```

### 4. Launch the Console

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
// Entities are available
nest> User
nest> Order
nest> Product

// Services are available (from src/*/*.service.ts)
nest> await usersService.findAll()
nest> await ordersService.findById('some-id')
nest> await productsService.findAll()
nest> await cacheService.getStats()
nest> await queuesService.getAllStatuses()

// Queue processors
nest> EmailProcessor
nest> NotificationProcessor

// Add jobs to queues
nest> await queuesService.addEmailJob({
  type: 'welcome',
  to: 'test@example.com',
  name: 'Test User'
})

// Check queue status
nest> await queuesService.getJobCounts('email')
nest> await queuesService.getRecentJobs('email', 'completed', 5)

// Cache operations
nest> await cacheService.set('test-key', { foo: 'bar' })
nest> await cacheService.get('test-key')
nest> await cacheService.getKeys('*')

// Raw MongoDB queries via models
nest> await User.find().limit(5)
nest> await Order.find({ status: 'pending' })
nest> await Product.find({ category: 'Electronics' })

// Redis operations via cache service
nest> await cacheService.getRedisClient().ping()
nest> await cacheService.getStats()

// Show all loaded models
nest> .models

// Show all loaded services
nest> .services

// Reload after code changes
nest> .reload
```

## Project Structure

```
src/
├── cache/
│   ├── cache.module.ts
│   ├── cache.service.ts       # → cacheService
│   └── redis.decorator.ts
├── orders/
│   ├── entities/order.entity.ts  # → Order
│   ├── orders.controller.ts
│   ├── orders.module.ts
│   └── orders.service.ts      # → ordersService
├── products/
│   ├── entities/product.entity.ts  # → Product
│   ├── products.module.ts
│   └── products.service.ts    # → productsService
├── queues/
│   ├── processors/
│   │   ├── email.processor.ts     # → EmailProcessor
│   │   └── notification.processor.ts  # → NotificationProcessor
│   ├── queues.module.ts
│   └── queues.service.ts      # → queuesService
├── users/
│   ├── entities/user.entity.ts    # → User
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts       # → usersService
├── app.module.ts
├── dashboard.controller.ts
├── health.controller.ts
└── main.ts
```

## Available in Console

### Entities
- `User` - User model
- `Order` - Order model
- `Product` - Product model

### Services
- `usersService` / `UsersService`
- `ordersService` / `OrdersService`
- `productsService` / `ProductsService`
- `cacheService` / `CacheService`
- `queuesService` / `QueuesService`

### Queue Processors
- `EmailProcessor`
- `NotificationProcessor`

### Utilities
- `cacheService.getRedisClient()` - Access raw Redis client

## Note on TypeScript

The console uses ts-node to load TypeScript files directly. Some files may have type errors (like virtual properties on Mongoose documents), but the console will still load other files successfully.

If you see TypeScript warnings during console startup, don't worry - the console will still work with the files that compile successfully.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /users | Create user |
| GET | /users | List users |
| GET | /users/:id | Get user |
| POST | /orders | Create order |
| GET | /orders/:id | Get order |
| GET | /orders/user/:userId | Get user orders |
| PATCH | /orders/:id/status | Update order status |
| GET | /dashboard/stats | Dashboard stats |

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

## Building for Production

```bash
npm run build
npm start
```

Then run console on compiled JS:
```bash
node-console --entry dist/main.js
```
