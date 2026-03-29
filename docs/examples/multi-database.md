# Multi-Database Example

This example demonstrates using NodeSH with multiple databases simultaneously.

## Scenario

An e-commerce application using:
- **MongoDB** - Product catalog, user profiles
- **PostgreSQL** - Orders, transactions (ACID compliance)
- **Redis** - Shopping cart, session cache
- **Neo4j** - Product recommendations (graph relationships)

## Project Structure

```
my-app/
├── src/
│   ├── models/
│   │   ├── Product.js        # MongoDB
│   │   └── User.js           # MongoDB
│   ├── services/
│   │   ├── orderService.js   # PostgreSQL
│   │   ├── cartService.js    # Redis
│   │   └── recommendationService.js  # Neo4j
│   └── config/
│       └── database.js       # Multi-db setup
├── .env                      # All DB connections
└── .nodesh.js
```

## Environment Configuration

```bash
# MongoDB - Product Catalog
MONGODB_URI=mongodb://localhost:27017/ecommerce

# PostgreSQL - Orders
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce

# Redis - Cart & Sessions
REDIS_URL=redis://localhost:6379

# Neo4j - Recommendations
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret
```

## Using in NodeSH Shell

### 1. Start All Databases

```bash
docker-compose up -d mongodb postgres redis neo4j
```

### 2. Launch NodeSH

```bash
nodesh --yes
```

### 3. Cross-Database Operations

```javascript
node> // Get user from MongoDB
node> const user = await User.findById('user123')

node> // Get cart from Redis
node> const cart = await cartService.getCart('user123')
{ items: [{ productId: 'prod1', qty: 2 }, { productId: 'prod2', qty: 1 }] }

node> // Get product details from MongoDB
node> const products = await Product.find({
...   _id: { $in: cart.items.map(i => i.productId) }
... })

node> // Create order in PostgreSQL
node> const order = await orderService.create({
...   userId: user._id,
...   items: cart.items,
...   total: products.reduce((sum, p) => sum + p.price, 0)
... })

node> // Clear cart in Redis
node> await cartService.clearCart('user123')

node> // Get recommendations from Neo4j
node> const recommendations = await recommendationService.getRecommendations(
...   user._id,
...   5
... )
[
  { product: 'Similar Product 1', score: 0.95 },
  { product: 'Similar Product 2', score: 0.87 },
  { product: 'Frequently Bought Together', score: 0.82 }
]
```

### 4. Check All Database Stats

```javascript
node> const { helpers } = await initDatabases()
node> await helpers.getDBStats()
{
  mongodb: {
    status: 'connected',
    collections: 5,
    documents: 15234
  },
  postgresql: {
    status: 'connected',
    tables: 12,
    rows: { orders: 4521, users: 1234 }
  },
  redis: {
    status: 'connected',
    keys: 856,
    memory: '2.5MB'
  },
  neo4j: {
    status: 'connected',
    nodes: 45678,
    relationships: 123456
  }
}
```

## Complete Session Example

```bash
$ cd my-app
$ nodesh

╔════════════════════════════════════════╗
║           NodeSH (nodesh)              ║
╚════════════════════════════════════════╝

Loading application...
✓ Loaded 23 files
✓ MongoDB connected
✓ PostgreSQL connected
✓ Redis connected
✓ Neo4j connected

node> // Simulate user purchase workflow
node> const user = await User.findOne({ email: 'john@example.com' })
node> const cart = await cartService.getCart(user._id.toString())
node> 
node> // Calculate totals
node> const productIds = cart.items.map(i => i.productId)
node> const products = await Product.find({ _id: { $in: productIds } })
node> const total = cart.items.reduce((sum, item) => {
...   const product = products.find(p => p._id.toString() === item.productId)
...   return sum + (product.price * item.qty)
... }, 0)

node> // Create order in PostgreSQL
node> const order = await orderService.create({
...   userId: user._id.toString(),
...   items: cart.items.map(item => ({
...     productId: item.productId,
...     quantity: item.qty,
...     price: products.find(p => p._id.toString() === item.productId).price
...   })),
...   total: total,
...   status: 'pending'
... })

node> // Update inventory in MongoDB
node> for (const item of cart.items) {
...   await Product.updateOne(
...     { _id: item.productId },
...     { $inc: { stock: -item.qty } }
...   )
... }

node> // Clear cart
node> await cartService.clearCart(user._id.toString())

node> // Create recommendation graph in Neo4j
node> await recommendationService.recordPurchase(
...   user._id.toString(),
...   cart.items.map(i => i.productId)
... )

node> // Show final stats
node> await showStats({
...   mongodbProducts: () => Product.countDocuments(),
...   postgresOrders: async () => {
...     const result = await pg.query('SELECT COUNT(*) FROM orders')
...     return parseInt(result.rows[0].count)
...   },
...   redisCarts: async () => {
...     const keys = await redis.keys('cart:*')
...     return keys.length
...   },
...   neo4jRelationships: async () => {
...     const result = await neo4j.run('MATCH ()-[r]->() RETURN count(r) as count')
...     return result.records[0].get('count').toNumber()
...   }
... })

node> .exit
```

## Docker Compose Setup

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secret
    volumes:
      - mongodb_data:/data/db

  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: ecommerce
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/secret
      NEO4J_PLUGINS: '["apoc"]
    volumes:
      - neo4j_data:/data

volumes:
  mongodb_data:
  postgres_data:
  redis_data:
  neo4j_data:
```

## Best Practices

1. **Use appropriate database for each use case:**
   - MongoDB - Flexible product data with varying attributes
   - PostgreSQL - ACID-compliant financial transactions
   - Redis - Fast, temporary session data
   - Neo4j - Complex relationship queries

2. **Transaction Management:**
   ```javascript
   // For multi-step operations, use transactions on the primary DB
   node> await pg.query('BEGIN')
   node> try {
   ...   await orderService.createOrder(data)
   ...   await paymentService.charge(paymentData)
   ...   await pg.query('COMMIT')
   ... } catch (e) {
   ...   await pg.query('ROLLBACK')
   ...   throw e
   ... }
   ```

3. **Caching Strategy:**
   ```javascript
   // Cache frequently accessed data in Redis
   node> let products = await cacheService.get('products:all')
   node> if (!products) {
   ...   products = await Product.find()
   ...   await cacheService.set('products:all', products, 300)
   ... }
   ```

4. **Cross-Database Consistency:**
   - Use event-driven architecture for eventual consistency
   - Implement retry logic for failed operations
   - Log all cross-database operations for debugging

## Related Documentation

- [Database Support Guide](../guides/database.md)
- [MongoDB Operations](../guides/database.md#mongodb-adapter)
- [PostgreSQL Operations](../guides/database.md#postgresql-adapter)
- [Redis Operations](../guides/database.md#redis-adapter)
- [Neo4j Operations](../guides/database.md#neo4j-adapter)
