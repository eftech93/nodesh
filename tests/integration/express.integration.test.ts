/**
 * Express Integration Tests
 *
 * Comprehensive execution tests for all generated console methods in the example Express project.
 */

import { CLISession, waitForDatabases, setupTestEnv } from './cli-harness';
import * as path from 'path';

const projectPath = path.join(__dirname, '../../example');

(process.env.ENABLE_INTEGRATION_TESTS === 'true' ? describe : describe.skip)('Express Integration Tests', () => {
  let session: CLISession;

  beforeAll(async () => {
    setupTestEnv();
    await waitForDatabases();
  }, 120000);

  beforeEach(async () => {
    session = await CLISession.create({
      projectPath,
      commandTimeout: 30000
    });
  }, 120000);

  afterEach(async () => {
    if (session) {
      await session.close();
      session = null as any;
    }
  });

  describe('Console Basics', () => {
    it('should start the CLI and evaluate expressions', async () => {
      const result = await session.execute('1 + 1');
      expect(result.output).toContain('2');
      expect(result.timedOut).toBe(false);
    });

    it('should show help context', async () => {
      const result = await session.execute('.help');
      expect(result.output).toContain('Available Context');
      expect(result.output).toContain('Models:');
      expect(result.output).toContain('Services:');
    });

    it('should list models with .models', async () => {
      const result = await session.execute('.models');
      expect(result.output).toContain('User');
      expect(result.output).toContain('Order');
      expect(result.output).toContain('Product');
    });

    it('should list services with .services', async () => {
      const result = await session.execute('.services');
      expect(result.output).toContain('UserService');
      expect(result.output).toContain('OrderService');
      expect(result.output).toContain('CacheService');
      expect(result.output).toContain('QueueService');
    });

    it('should show routes with .routes', async () => {
      const result = await session.execute('.routes');
      expect(result.output).toContain('Routes:');
      expect(result.output).toContain('/health');
      expect(result.output).toContain('/api/users');
      expect(result.output).toContain('/api/orders');
    });

    it('should show config with .config', async () => {
      const result = await session.execute('.config');
      expect(result.output).toContain('Configuration:');
      expect(result.output).toContain('NODE_ENV');
    });

    it('should show env with .env', async () => {
      const result = await session.execute('.env');
      expect(result.output).toContain('Environment Variables:');
      expect(result.output).toContain('NODE_ENV');
    });
  });

  describe('Endpoints', () => {
    function expressEndpoint(method: string, path: string, body?: Record<string, unknown>) {
      const bodyStr = body
        ? `, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${JSON.stringify(body).replace(/'/g, "\\'")})`
        : '';
      return `
await (async () => {
  await connectDB();
  const server = app.listen(3456);
  try {
    const res = await fetch('http://localhost:3456${path}', { method: '${method}'${bodyStr} });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text().catch(() => ''); }
    console.log(JSON.stringify({ status: res.status, body: data }));
  } finally {
    await new Promise(r => server.close(r));
  }
})()
      `.trim();
    }

    it('GET /health should return ok', async () => {
      const result = await session.execute(expressEndpoint('GET', '/health'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('"status":"ok"');
    });

    it('HEAD /health should be handled', async () => {
      const result = await session.execute(expressEndpoint('HEAD', '/health'));
      expect(result.output).toContain('"status":200');
    });

    it('POST /api/users should create a user', async () => {
      const email = `express-endpoint-${Date.now()}@test.com`;
      const result = await session.execute(
        expressEndpoint('POST', '/api/users', {
          email,
          password: 'password',
          name: { first: 'Endpoint', last: 'Test' }
        })
      );
      expect(result.output).toContain('"status":201');
      expect(result.output).toContain(email);
    });

    it('GET /api/users should list users', async () => {
      const result = await session.execute(expressEndpoint('GET', '/api/users?page=1&limit=5'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('users');
      expect(result.output).toContain('pagination');
    });

    it('GET /api/users/:id should return a user', async () => {
      const email = `express-user-${Date.now()}@test.com`;
      const cmd = `
await (async () => {
  await connectDB();
  const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } });
  const server = app.listen(3456);
  try {
    const res = await fetch('http://localhost:3456/api/users/' + u._id.toString(), { method: 'GET' });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text().catch(() => ''); }
    console.log(JSON.stringify({ status: res.status, body: data }));
  } finally {
    await new Promise(r => server.close(r));
  }
})()
      `.trim();
      const result = await session.execute(cmd);
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain(email);
    });

    it('DELETE /api/users/123 should return 404', async () => {
      const result = await session.execute(expressEndpoint('DELETE', '/api/users/123'));
      expect(result.output).toContain('"status":404');
    });

    it('POST /api/orders should create an order', async () => {
      const email = `express-order-user-${Date.now()}@test.com`;
      const sku = `SKU-${Date.now()}`;
      const cmd = `
await (async () => {
  await connectDB();
  const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } });
  const p = await Product.create({ sku: '${sku}', name: 'Test Product', description: 'Desc', price: 10, category: 'test', inventory: { quantity: 100 } });
  const server = app.listen(3456);
  try {
    const res = await fetch('http://localhost:3456/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u._id.toString(), items: [{ productId: p._id.toString(), quantity: 1 }], shippingAddress: { street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' } })
    });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text().catch(() => ''); }
    console.log(JSON.stringify({ status: res.status, body: data }));
  } finally {
    await new Promise(r => server.close(r));
  }
})()
      `.trim();
      const result = await session.execute(cmd);
      expect(result.output).toContain('"status":201');
      expect(result.output).toContain('orderNumber');
    });

    it('PATCH /api/orders/:id/status should update status', async () => {
      const email = `express-patch-user-${Date.now()}@test.com`;
      const sku = `SKU2-${Date.now()}`;
      const cmd = `
await (async () => {
  await connectDB();
  const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } });
  const p = await Product.create({ sku: '${sku}', name: 'P2', description: 'D', price: 5, category: 'c', inventory: { quantity: 100 } });
  const o = await orderService.create(u._id.toString(), [{ productId: p._id.toString(), quantity: 1 }], { street: 'St', city: 'City', state: 'ST', zipCode: '00000', country: 'US' });
  const server = app.listen(3456);
  try {
    const res = await fetch('http://localhost:3456/api/orders/' + o._id.toString() + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing' })
    });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text().catch(() => ''); }
    console.log(JSON.stringify({ status: res.status, body: data }));
  } finally {
    await new Promise(r => server.close(r));
  }
})()
      `.trim();
      const result = await session.execute(cmd);
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('processing');
    });

    it('GET /api/dashboard/stats should return stats', async () => {
      const result = await session.execute(expressEndpoint('GET', '/api/dashboard/stats'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('orders');
      expect(result.output).toContain('users');
      expect(result.output).toContain('queues');
    });
  });

  describe('Models', () => {
    it('User.create should create a user', async () => {
      const email = `model-user-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } }); JSON.stringify({ email: u.email, isActive: u.isActive })`
      );
      expect(result.output).toContain(email);
      expect(result.output).toContain('true');
    });

    it('User.findByEmail should find a user', async () => {
      const email = `findbyemail-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } })`
      );
      const result = await session.execute(
        `await connectDB(); const u = await User.findByEmail('${email}'); JSON.stringify({ found: !!u, email: u ? u.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });

    it('User.findActive should return active users', async () => {
      const result = await session.execute(
        `await connectDB(); const users = await User.findActive(); JSON.stringify({ isArray: Array.isArray(users) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('User.getStats should return stats object', async () => {
      const result = await session.execute(
        `await connectDB(); const s = await User.getStats(); JSON.stringify({ hasTotal: typeof s.total === 'number', hasActive: typeof s.active === 'number' })`
      );
      expect(result.output).toContain('"hasTotal":true');
      expect(result.output).toContain('"hasActive":true');
    });

    it('User instance comparePassword should work', async () => {
      const result = await session.execute(
        `await connectDB(); const u = new User({ password: 'hashed' }); const r = await u.comparePassword('hashed'); JSON.stringify({ result: typeof r === 'boolean' })`
      );
      expect(result.output).toContain('"result":true');
    });

    it('Order.create should create an order', async () => {
      const email = `order-model-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'A', last: 'B' } }); global.__orderModelUser = u._id.toString()`
      );
      const result = await session.execute(
        `await connectDB(); const o = await Order.create({ user: global.__orderModelUser, orderNumber: 'ORD-${Date.now()}', items: [{ product: 'P', quantity: 1, price: 10 }], totalAmount: 10 }); JSON.stringify({ orderNumber: o.orderNumber, total: o.totalAmount })`
      );
      expect(result.output).toContain('ORD-');
      expect(result.output).toContain('"total":10');
    });

    it('Order.findByUser should find orders', async () => {
      const result = await session.execute(
        `await connectDB(); const orders = await Order.findByUser(global.__orderModelUser); JSON.stringify({ isArray: Array.isArray(orders) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('Order.getRevenueStats should return revenue stats', async () => {
      const result = await session.execute(
        `await connectDB(); const s = await Order.getRevenueStats(); JSON.stringify({ hasTotalRevenue: typeof s.totalRevenue === 'number' })`
      );
      expect(result.output).toContain('"hasTotalRevenue":true');
    });

    it('Order.generateOrderNumber should return a string', async () => {
      const result = await session.execute(
        `const n = Order.generateOrderNumber(); JSON.stringify({ isString: typeof n === 'string', startsWith: n.startsWith('ORD-') })`
      );
      expect(result.output).toContain('"isString":true');
      expect(result.output).toContain('"startsWith":true');
    });

    it('Product.create should create a product', async () => {
      const sku = `SKU-MODEL-${Date.now()}`;
      const result = await session.execute(
        `await connectDB(); const p = await Product.create({ sku: '${sku}', name: 'Test', description: 'Desc', price: 99, category: 'test' }); JSON.stringify({ sku: p.sku, name: p.name })`
      );
      expect(result.output).toContain(sku);
      expect(result.output).toContain('Test');
    });

    it('Product.findByCategory should find products', async () => {
      const result = await session.execute(
        `await connectDB(); const products = await Product.findByCategory('test'); JSON.stringify({ isArray: Array.isArray(products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('Product.findInStock should return array', async () => {
      const result = await session.execute(
        `await connectDB(); const products = await Product.findInStock(); JSON.stringify({ isArray: Array.isArray(products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('Product.getLowStock should return array', async () => {
      const result = await session.execute(
        `await connectDB(); const products = await Product.getLowStock(5); JSON.stringify({ isArray: Array.isArray(products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });
  });

  describe('Services', () => {
    it('userService.create should create a user', async () => {
      const email = `svc-create-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const u = await userService.create({ email: '${email}', password: 'pw', name: { first: 'S', last: 'C' } }); JSON.stringify({ email: u.email })`
      );
      expect(result.output).toContain(email);
    });

    it('userService.findByEmail should find user', async () => {
      const email = `svc-find-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await userService.create({ email: '${email}', password: 'pw', name: { first: 'S', last: 'F' } })`
      );
      const result = await session.execute(
        `await connectDB(); const u = await userService.findByEmail('${email}'); JSON.stringify({ found: !!u, email: u ? u.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });

    it('userService.findActive should return paginated users', async () => {
      const result = await session.execute(
        `await connectDB(); const r = await userService.findActive({ page: 1, limit: 5 }); JSON.stringify({ hasUsers: Array.isArray(r.users), hasPagination: !!r.pagination })`
      );
      expect(result.output).toContain('"hasUsers":true');
      expect(result.output).toContain('"hasPagination":true');
    });

    it('userService.authenticate should authenticate a user', async () => {
      const email = `svc-auth-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await userService.create({ email: '${email}', password: 'secret123', name: { first: 'A', last: 'U' } })`
      );
      const result = await session.execute(
        `await connectDB(); const u = await userService.authenticate('${email}', 'secret123'); JSON.stringify({ found: !!u, email: u ? u.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });

    it('userService.getStats should return stats', async () => {
      const result = await session.execute(
        `await connectDB(); const s = await userService.getStats(); JSON.stringify({ hasTotal: typeof s.total === 'number' })`
      );
      expect(result.output).toContain('"hasTotal":true');
    });

    it('orderService.create should create an order', async () => {
      const email = `svc-order-user-${Date.now()}@test.com`;
      const sku = `SVC-${Date.now()}`;
      await session.execute(
        `await connectDB(); const u = await User.create({ email: '${email}', password: 'pw', name: { first: 'O', last: 'U' } }); const p = await Product.create({ sku: '${sku}', name: 'SvcP', description: 'D', price: 15, category: 'svc', inventory: { quantity: 50 } }); global.__svcOrderUser = u._id.toString(); global.__svcProduct = p._id.toString()`
      );
      const result = await session.execute(
        `await connectDB(); const o = await orderService.create(global.__svcOrderUser, [{ productId: global.__svcProduct, quantity: 2 }], { street: 'St', city: 'City', state: 'ST', zipCode: '00000', country: 'US' }); JSON.stringify({ hasOrderNumber: !!o.orderNumber, status: o.status })`
      );
      expect(result.output).toContain('"hasOrderNumber":true');
      expect(result.output).toContain('"status":"pending"');
    });

    it('orderService.getDashboardStats should return stats', async () => {
      const result = await session.execute(
        `await connectDB(); const s = await orderService.getDashboardStats(); JSON.stringify({ hasTotalOrders: typeof s.totalOrders === 'number' })`
      );
      expect(result.output).toContain('"hasTotalOrders":true');
    });

    it('cacheService.set and get should work', async () => {
      const key = `cache-${Date.now()}`;
      await session.execute(`await cacheService.set('${key}', { value: 42 })`);
      const result = await session.execute(`const v = await cacheService.get('${key}'); JSON.stringify(v)`);
      expect(result.output).toContain('"value":42');
    });

    it('cacheService.exists should return true for existing key', async () => {
      const key = `exists-${Date.now()}`;
      await session.execute(`await cacheService.set('${key}', 'hello')`);
      const result = await session.execute(`const v = await cacheService.exists('${key}'); JSON.stringify({ exists: v })`);
      expect(result.output).toContain('"exists":true');
    });

    it('queueService.getAllStatuses should return object', async () => {
      const result = await session.execute(`const s = await queueService.getAllStatuses(); JSON.stringify({ isObject: typeof s === 'object' })`);
      expect(result.output).toContain('"isObject":true');
    });

    it('queueService.getJobCounts should return counts', async () => {
      const result = await session.execute(`const c = await queueService.getJobCounts(); JSON.stringify({ isObject: typeof c === 'object' })`);
      expect(result.output).toContain('"isObject":true');
    });

    it('queueService.addTestEmailJob should add a job', async () => {
      const result = await session.execute(`const job = await queueService.addTestEmailJob('test@example.com', 'Subject', 'Body'); JSON.stringify({ hasId: !!job.id })`);
      expect(result.output).toContain('"hasId":true');
    });
  });

  describe('Custom Context & Database', () => {
    it('connectDB should connect to MongoDB', async () => {
      const result = await session.execute(
        `await connectDB(); const u = await User.findOne(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('redis.set and redis.get should work', async () => {
      const key = `redis-${Date.now()}`;
      await session.execute(`await redis.set('${key}', 'redis-value')`);
      const result = await session.execute(`const v = await redis.get('${key}'); JSON.stringify({ value: v })`);
      expect(result.output).toContain('redis-value');
    });

    it('redis.ping should return PONG', async () => {
      const result = await session.execute('await redis.ping()');
      expect(result.output).toContain('PONG');
    });
  });
});
