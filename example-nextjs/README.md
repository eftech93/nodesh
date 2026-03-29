# NodeSH Example - Next.js

This is a complete Next.js example application demonstrating NodeSH integration with:

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript**
- ✅ **MongoDB** with Mongoose
- ✅ **PostgreSQL** with direct SQL
- ✅ **MySQL** with transactions
- ✅ **Neo4j** Graph Database
- ✅ **DynamoDB** (AWS or Local)
- ✅ **Redis** for caching
- ✅ **REST API** with full CRUD
- ✅ **Server Actions** with full testing support
- ✅ **NodeSH** interactive shell

## Quick Start

### 1. Start Infrastructure

```bash
npm run docker:up
```

This starts all databases and admin UIs:

| Service | Port | Description | Admin UI |
|---------|------|-------------|----------|
| MongoDB | 27017 | Document Database | - |
| PostgreSQL | 5432 | Relational Database | pgAdmin at http://localhost:8082 |
| MySQL | 3306 | Relational Database | phpMyAdmin at http://localhost:8083 |
| Neo4j | 7474 (HTTP), 7687 (Bolt) | Graph Database | Neo4j Browser at http://localhost:7474 |
| DynamoDB Local | 8000 | NoSQL Database | DynamoDB Admin at http://localhost:8084 |
| Redis | 6379 | In-Memory Cache | Redis Commander at http://localhost:8081 |

**Default Admin UI Credentials:**
- **pgAdmin** (PostgreSQL): http://localhost:8082
  - Email: `admin@nodesh.local`
  - Password: `admin`
  - Add server: Host `postgres`, Port `5432`, Database `nodesh_example`

- **phpMyAdmin** (MySQL): http://localhost:8083
  - Server: `mysql`
  - Username: `root`
  - Password: `mysql`

- **Neo4j Browser**: http://localhost:7474
  - Username: `neo4j`
  - Password: `neo4j`
  - Connect URL: `bolt://localhost:7687`

- **DynamoDB Admin**: http://localhost:8084
  - No credentials needed for local DynamoDB

- **Redis Commander**: http://localhost:8081
  - Auto-connects to Redis

### Multi-Database Support

This example includes adapters for multiple databases via NodeSH:

```bash
# Connect to PostgreSQL
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=nodesh_example
export PGUSER=postgres
export PGPASSWORD=postgres

# Connect to MySQL
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=nodesh_example
export MYSQL_USER=root
export MYSQL_PASSWORD=mysql

# Connect to Neo4j
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=neo4j

# Connect to DynamoDB Local
export DYNAMODB_LOCAL=true
export DYNAMODB_ENDPOINT=http://localhost:8000
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
```

Or simply copy the example environment file:

```bash
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Database Drivers (Optional)

To use specific databases, install their drivers:

```bash
# PostgreSQL
npm install pg

# MySQL
npm install mysql2

# Neo4j
npm install neo4j-driver

# DynamoDB (AWS SDK)
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

Or install all at once:

```bash
npm install pg mysql2 neo4j-driver @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### 4. Launch NodeSH Console

```bash
npm run console
# or: nodesh --yes
```

## NodeSH Console Examples

### Basic Database Operations (Recommended)

```javascript
// Create a user
next> const user = await UserService.create({
  email: 'john.doe@example.com',
  password: 'password123',
  name: { first: 'John', last: 'Doe' },
  role: 'user'
})

// Get user ID
next> user._id

// Fetch user by ID
next> await UserService.findById(user._id.toString())

// Fetch by email
next> await UserService.findByEmail('john.doe@example.com')

// List all users
next> await UserService.findAll()

// Get user stats
next> await UserService.getStats()
```

### Using Mongoose Model Directly

```javascript
// Create a user
next> const user = await User.create({
  email: 'jane.smith@example.com',
  password: 'password123',
  name: { first: 'Jane', last: 'Smith' },
  role: 'admin'
})

// Find by ID
next> await User.findById(user._id)

// Find all active users
next> await User.find({ isActive: true })

// Count users
next> await User.countDocuments()

// Update user
next> await User.findByIdAndUpdate(user._id, { role: 'admin' })
```

### Complete Workflow Example

```javascript
// 1. Seed database with sample users
next> await seed(5)

// 2. Count users
next> await User.countDocuments()

// 3. Get all users
next> const { users } = await UserService.findAll(1, 10)

// 4. Get first user
next> const firstUser = users[0]

// 5. Update user role
next> await UserService.update(firstUser._id.toString(), { role: 'admin' })

// 6. Verify update
next> await UserService.findById(firstUser._id.toString())

// 7. Get stats
next> await UserService.getStats()

// 8. Clear database (if needed)
next> await clear()
```

### Database Utilities

```javascript
// Check database connection
next> await getDBStats()

// Seed with random users
next> await seed(10)

// Clear all data
next> await clear()

// Quick stats
next> await stats()
```

## Server Actions

This example includes Server Actions that can be tested directly from NodeSH:

### User Actions

```javascript
// Get all users
next> await userGetUsersAction()

// Get user by ID
next> await userGetUserByIdAction('1')

// Create a new user
next> await userCreateUserAction({
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'user'
})

// Search users
next> await userSearchUsersAction('john')

// Update user
next> await userUpdateUserAction('1', { role: 'admin' })

// Delete user
next> await userDeleteUserAction('2')
```

### Order Actions

```javascript
// Get all orders
next> await orderGetOrdersAction()

// Create an order
next> await orderCreateOrderAction({
  userId: '1',
  items: [
    { productId: 'P1', name: 'Widget', quantity: 2, price: 29.99 },
    { productId: 'P2', name: 'Gadget', quantity: 1, price: 49.99 }
  ],
  status: 'pending'
})

// Get orders by user
next> await orderGetOrdersByUserAction('1')

// Update order status
next> await orderUpdateOrderStatusAction('ORD-1001', 'shipped')

// Cancel an order
next> await orderCancelOrderAction('ORD-1001')

// Get order statistics
next> await orderGetOrderStatsAction()
```

### Testing Server Actions

Run the automated test script:

```bash
# Test all server actions
npm run test:actions

# Or directly
node test-server-actions.js
```

### How Server Actions Work

1. **Automatic Discovery**: NodeSH scans for files with:
   - `'use server'` directive
   - `.actions.ts` or `.actions.js` suffix
   - Located in `app/actions/`, `lib/actions/`, or `src/lib/actions/`

2. **Action Naming**: Actions are named as:
   ```
   {directory}_{filename}_{functionName}Action
   ```
   Example: `lib/actions/user.ts` with `getUsers()` → `libActionsUserGetUsersAction`

3. **Console Output**: Actions show execution logs:
   ```
   🚀 Executing server action: libActionsUserCreateUserAction()
   [Server Action] Creating user: { name: 'Alice', ... }
   ✅ libActionsUserCreateUserAction() completed in 215ms
   ```

## Multi-Database Console Examples

### PostgreSQL

```javascript
// Connect to PostgreSQL
next> await connectPostgres()

// Execute SQL queries
next> await pg.query('SELECT * FROM users WHERE id = $1', [1])
next> await pg.query('SELECT * FROM users LIMIT $1', [10])

// Use the User repository
next> await UserRepo.findAll()
next> await UserRepo.create({ name: 'John', email: 'john@example.com', role: 'user' })
next> await UserRepo.search('john')
next> await UserRepo.count()

// Get table info
next> await pg.getTables()
next> await pg.getStats()
```

### MySQL

```javascript
// Connect to MySQL
next> await connectMySQL()

// Query products
next> await mysql.query('SELECT * FROM products WHERE category = ?', ['electronics'])
next> await ProductRepo.findAll()
next> await ProductRepo.create({ name: 'Laptop', price: 999.99, category: 'electronics' })
next> await ProductRepo.getLowStock(5)

// Execute with transactions
next> await OrderRepo.createWithItems(
  { userId: 1, total: 150.00 },
  [
    { productId: 1, quantity: 2, price: 50.00 },
    { productId: 2, quantity: 1, price: 50.00 }
  ]
)

// Get database stats
next> await mysql.getStats()
```

### Neo4j (Graph Database)

```javascript
// Connect to Neo4j
next> await connectNeo4j()

// Initialize schema
next> await initNeo4jSchema()

// Create users and relationships
next> await SocialGraph.createUser({ id: '1', name: 'Alice', email: 'alice@example.com' })
next> await SocialGraph.createUser({ id: '2', name: 'Bob', email: 'bob@example.com' })

// Create follows relationship
next> await SocialGraph.follow('1', '2')

// Query relationships
next> await SocialGraph.getFollowers('2')
next> await SocialGraph.getFollowing('1')
next> await SocialGraph.getFriends('1')
next> await SocialGraph.getCounts('1')

// Get recommendations (friends of friends)
next> await SocialGraph.getRecommendations('1')

// Create posts
next> await SocialGraph.createPost('1', 'Hello Neo4j!', ['graph', 'database'])
next> await SocialGraph.getFeed('2')

// Knowledge graph
next> await KnowledgeGraph.createCategory('Electronics')
next> await KnowledgeGraph.createCategory('Laptops', 'Electronics')
next> await KnowledgeGraph.getCategoryTree('Electronics')

// Get graph stats
next> await neo4j.getStats()
```

### DynamoDB

```javascript
// Connect to DynamoDB
next> await connectDynamoDB()

// List tables
next> await dynamo.listTables()

// User operations
next> await UserDynamoRepo.create({ name: 'Alice', email: 'alice@example.com' })
next> await UserDynamoRepo.findById('user-123')
next> await UserDynamoRepo.list(10)

// Session store
next> await SessionStore.create('sess-123', { userId: 'user-456', ttl: 3600 })
next> await SessionStore.get('sess-123')

// Audit logging
next> await AuditLog.log({ entityType: 'User', entityId: '123', action: 'CREATE' })
next> await AuditLog.getLogsForEntity('User', '123')
```

## Available in NodeSH Context

### Models & Services
| Variable | Description |
|----------|-------------|
| `User` | Mongoose User model |
| `UserService` | User service class with caching |

### Database Utilities
| Variable | Description |
|----------|-------------|
| `connectDB` | Connect to database |
| `getDBStats` | Get DB connection status |
| `redisClient` | Redis client instance |
| `pg` | PostgreSQL connection |
| `mysql` | MySQL connection |
| `neo4j` | Neo4j connection |
| `dynamo` | DynamoDB connection |
| `seed(count)` | Seed database with random users |
| `clear()` | Clear all data |
| `stats()` | Show quick stats |
| `connectPostgres()` | Connect to PostgreSQL |
| `connectMySQL()` | Connect to MySQL |
| `connectNeo4j()` | Connect to Neo4j |
| `connectDynamoDB()` | Connect to DynamoDB |

### General
| Variable | Description |
|----------|-------------|
| `env` | Environment variables |
| `NODE_ENV` | Current environment |
| `nextConfig` | Next.js configuration |

## Docker Management

### Stop All Services

```bash
npm run docker:down
# or: docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f mysql
docker-compose logs -f neo4j
```

### Reset Data

```bash
# Stop and remove all data volumes
docker-compose down -v

# Start fresh
npm run docker:up
```

### Individual Services

```bash
# Start only MongoDB and Redis
docker-compose up -d mongo redis

# Start only PostgreSQL
docker-compose up -d postgres pgadmin

# Start only Neo4j
docker-compose up -d neo4j

# Start only DynamoDB
docker-compose up -d dynamodb dynamodb-admin
```

## API Endpoints

The example also includes REST API endpoints that can be tested with curl or the browser:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (query: page, limit) |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user |
| GET | `/api/stats` | Get app statistics |

### PostgreSQL API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (query: category, search, limit) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product by ID |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### MySQL API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (query: userId, status) |
| POST | `/api/orders` | Create order with items |
| GET | `/api/orders/:id` | Get order by ID |
| PATCH | `/api/orders/:id` | Update order status |
| DELETE | `/api/orders/:id` | Cancel order |

### Neo4j API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social` | Get social stats |
| POST | `/api/social` | Create social user |
| GET | `/api/social/users` | Search users (query: q, userId, followers, following) |
| POST | `/api/social/follow` | Follow a user |
| DELETE | `/api/social/follow` | Unfollow a user |

### DynamoDB API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dynamo-users` | List users (query: id, email, role, limit) |
| POST | `/api/dynamo-users` | Create user |
| GET | `/api/dynamo-users/:id` | Get user by ID |
| PATCH | `/api/dynamo-users/:id` | Update user |
| DELETE | `/api/dynamo-users/:id` | Delete user |

### Test API with curl

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": { "first": "Test", "last": "User" }
  }'

# List users
curl http://localhost:3000/api/users

# Get stats
curl http://localhost:3000/api/stats
```

### Test PostgreSQL API

```bash
# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "electronics",
    "stock": 50
  }'

# List products
curl http://localhost:3000/api/products

# Search products
curl "http://localhost:3000/api/products?search=laptop"

# Get product by ID
curl http://localhost:3000/api/products/1
```

### Test MySQL API

```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 1, "quantity": 2, "price": 999.99},
      {"productId": 2, "quantity": 1, "price": 49.99}
    ]
  }'

# List orders
curl http://localhost:3000/api/orders

# Get orders by user
curl "http://localhost:3000/api/orders?userId=1"

# Update order status
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

### Test Neo4j API

```bash
# Create social user
curl -X POST http://localhost:3000/api/social \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-1",
    "name": "Alice",
    "email": "alice@example.com",
    "bio": "Software developer"
  }'

# Create another user
curl -X POST http://localhost:3000/api/social \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-2",
    "name": "Bob",
    "email": "bob@example.com"
  }'

# Follow user
curl -X POST http://localhost:3000/api/social/follow \
  -H "Content-Type: application/json" \
  -d '{"followerId": "user-1", "followingId": "user-2"}'

# Get followers
curl "http://localhost:3000/api/social/users?userId=user-2&followers=true"
```

### Test DynamoDB API

```bash
# Create user
curl -X POST http://localhost:3000/api/dynamo-users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "metadata": {"department": "engineering"}
  }'

# List users
curl http://localhost:3000/api/dynamo-users

# Get user by ID
curl http://localhost:3000/api/dynamo-users/user-123

# Search by role
curl "http://localhost:3000/api/dynamo-users?role=admin"
```

## Troubleshooting

### MongoDB Connection Error
```bash
# Make sure Docker is running
npm run docker:up

# Check MongoDB status
docker ps | grep mongo
```

### Redis Connection Error
Redis errors are non-fatal. The app works without Redis, just without caching.

### TypeScript Errors
Install ts-node and tsconfig-paths:
```bash
npm install --save-dev ts-node tsconfig-paths
```

## License

MIT
