/**
 * Express Application - API Server
 * 
 * Features:
 * - MongoDB with Mongoose
 * - Redis caching
 * - BullMQ job queues
 * - REST API endpoints
 */
const express = require('express');
const { connectDB } = require('./config/database');
const { redis } = require('./config/redis');
const { queues } = require('./config/queue');

// Import models
const { User, Order, Product } = require('./models');

// Import services
const { UserService, OrderService, QueueService, CacheService } = require('./services');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'checking...',
      redis: 'checking...'
    }
  };
  
  // Check MongoDB
  try {
    await connectDB();
    health.services.mongodb = 'connected';
  } catch (err) {
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
  }
  
  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'connected';
  } catch (err) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// User routes
app.post('/api/users', async (req, res) => {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await UserService.findActive(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await UserService.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order routes
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;
    const order = await OrderService.create(userId, items, shippingAddress);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await OrderService.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderService.updateStatus(req.params.id, status);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [orderStats, userStats, queueStatuses] = await Promise.all([
      OrderService.getDashboardStats(),
      UserService.getStats(),
      QueueService.getAllStatuses()
    ]);
    
    res.json({
      orders: orderStats,
      users: userStats,
      queues: queueStatuses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Export for console
module.exports = app;

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  // Connect to database first
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log('');
        console.log('To use the console:');
        console.log('  1. Start infrastructure: npm run docker:up');
        console.log('  2. Run console: npx node-console --yes');
      });
    })
    .catch(err => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });
}
