# NodeSH Example - NestJS with Multi-Database Support

This is a comprehensive example application demonstrating NodeSH integration with NestJS and **7+ databases**:

| Database | Type | Usage in this App |
|----------|------|-------------------|
| 🍃 MongoDB | Document | Users, Products, Orders |
| 🐘 PostgreSQL | Relational | Customers |
| 🐬 MySQL | Relational | Inventory |
| ⚡ Redis | Key-Value | Caching, Sessions, BullMQ |
| 🕸️ Neo4j | Graph | Product Recommendations |
| 📦 DynamoDB | NoSQL | Analytics Events |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         NestJS API                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Users  │ │ Products│ │ Orders  │ │ Queues  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐           │
│  │ MongoDB │ │ MongoDB │ │ MongoDB │ │  Redis  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Postgres│ │  MySQL  │ │  Neo4j  │ │ DynamoDB│           │
│  │Customers│ │Inventory│ │Recommend│ │Analytics│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start All Databases

```bash
npm run docker:up
```

This starts:
- **MongoDB** on port 27017
- **PostgreSQL** on port 5432
- **MySQL** on port 3306
- **Redis** on port 6379
- **Neo4j** on ports 7474 (HTTP) and 7687 (Bolt)
- **DynamoDB Local** on port 8000
- **Redis Commander** on port 8081
- **pgAdmin** on port 8082
- **phpMyAdmin** on port 8083

### 2. Setup DynamoDB Tables

```bash
npm run db:setup
```

### 3. Start the Application

```bash
# Development mode
npm run start:dev

# Or build and run
npm run build
npm start
```

### 4. Launch NodeSH Console

```bash
npm run console
```

## API Endpoints

### MongoDB Endpoints
- `GET /users` - List all users
- `GET /products` - List all products
- `GET /orders` - List all orders

### PostgreSQL Endpoints
- `GET /postgres/customers` - List customers
- `GET /postgres/customers/stats` - Customer statistics
- `POST /postgres/customers` - Create customer

### MySQL Endpoints
- `GET /mysql/inventory` - List inventory
- `GET /mysql/inventory/stats` - Inventory statistics
- `GET /mysql/inventory/low-stock` - Low stock items
- `PUT /mysql/inventory/:id/stock` - Update stock

### Neo4j Endpoints
- `GET /neo4j/recommendations/:productId` - Get product recommendations
- `GET /neo4j/recommendations/customer/:customerId` - Customer recommendations
- `POST /neo4j/recommendations/view` - Record product view

### DynamoDB Endpoints
- `GET /dynamodb/analytics/stats` - Analytics statistics
- `GET /dynamodb/analytics/events` - Recent events
- `POST /dynamodb/analytics/pageview` - Record page view
- `POST /dynamodb/analytics/purchase` - Record purchase

### Dashboard Endpoints
- `GET /dashboard/all-stats` - Stats from all databases
- `GET /dashboard/mongodb` - MongoDB stats
- `GET /dashboard/postgresql` - PostgreSQL stats
- `GET /dashboard/mysql` - MySQL stats
- `GET /dashboard/neo4j` - Neo4j stats
- `GET /dashboard/dynamodb` - DynamoDB stats

## Using NodeSH Console

### Cross-Database Operations

```bash
$ npm run console

nest> // Create a customer in PostgreSQL
nest> const customer = await customersService.create({
...   email: 'alice@example.com',
...   firstName: 'Alice',
...   lastName: 'Smith'
... })

nest> // Add inventory in MySQL
nest> const item = await inventoryService.create({
...   sku: 'NEW-001',
...   productName: 'New Product',
...   quantity: 100,
...   unitPrice: 49.99,
...   warehouse: 'NYC'
... })

nest> // Create a user in MongoDB
nest> const user = await usersService.create({
...   email: 'alice@example.com',
...   password: 'password123',
...   name: { first: 'Alice', last: 'Smith' }
... })

nest> // Create a product recommendation in Neo4j
nest> await recommendationsService.createProductView(customer.id, 'prod-1')

nest> // Record analytics in DynamoDB
nest> await analyticsService.recordPageView('/products', user._id.toString())

nest> // Get all database stats
nest> await databaseDashboardController.getAllStats()
```

### Individual Database Operations

```javascript
// MongoDB
nest> await User.find().limit(5)
nest> await Product.find({ price: { $gt: 100 } })
nest> await Order.find().populate('user').populate('items.product')

// PostgreSQL
nest> await customersService.findAll()
nest> await customerRepository.findOne({ where: { email: 'test@test.com' } })

// MySQL
nest> await inventoryService.getLowStock(10)
nest> await inventoryService.updateStock(itemId, -5)

// Redis
nest> await cacheService.set('key', 'value', 3600)
nest> await cacheService.get('key')
nest> await cacheService.getStats()

// Neo4j
nest> await recommendationsService.getRecommendations('prod-1', 5)
nest> await recommendationsService.getStats()

// DynamoDB
nest> await analyticsService.getStats()
nest> await analyticsService.recordPurchase('order-123', 299.99, 'customer-456')
```

## Database Management UIs

After running `npm run docker:up`, access the database management tools:

| Tool | URL | Description |
|------|-----|-------------|
| Redis Commander | http://localhost:8081 | Redis GUI |
| pgAdmin | http://localhost:8082 | PostgreSQL GUI |
| phpMyAdmin | http://localhost:8083 | MySQL GUI |
| Neo4j Browser | http://localhost:7474 | Neo4j GUI |

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | mongodb://admin:password@localhost:27017/nodeconsole | MongoDB connection |
| `POSTGRES_HOST` | localhost | PostgreSQL host |
| `POSTGRES_PORT` | 5432 | PostgreSQL port |
| `MYSQL_HOST` | localhost | MySQL host |
| `MYSQL_PORT` | 3306 | MySQL port |
| `REDIS_HOST` | localhost | Redis host |
| `NEO4J_URI` | bolt://localhost:7687 | Neo4j connection |
| `DYNAMODB_ENDPOINT` | http://localhost:8000 | DynamoDB endpoint |

## Stopping the Databases

```bash
npm run docker:down
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
docker ps | grep mongo

# View MongoDB logs
docker logs node-console-mongodb
```

### PostgreSQL Connection Issues
```bash
# Check PostgreSQL logs
docker logs node-console-postgres
```

### DynamoDB Issues
```bash
# Re-run setup
npm run db:setup
```

### Reset All Data
```bash
# Stop and remove volumes
npm run docker:down
docker volume prune

# Restart
npm run docker:up
npm run db:setup
```

## License

MIT
