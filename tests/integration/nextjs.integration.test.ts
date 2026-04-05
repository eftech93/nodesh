/**
 * Next.js Integration Tests
 *
 * Comprehensive execution tests for all generated console methods in the example-nextjs project.
 */

import { CLISession, waitForDatabases, setupTestEnv } from './cli-harness';
import * as path from 'path';

const projectPath = path.join(__dirname, '../../example-nextjs');

(process.env.ENABLE_INTEGRATION_TESTS === 'true' ? describe : describe.skip)('Next.js Integration Tests', () => {
  let session: CLISession;

  beforeAll(async () => {
    console.log('[Test] Setting up test environment...');
    setupTestEnv();
    console.log('[Test] Waiting for databases...');
    await waitForDatabases();
    console.log('[Test] Databases ready');
  }, 120000);

  beforeEach(async () => {
    session = await CLISession.create({
      projectPath,
      debug: false,
      commandTimeout: 60000
    });
  }, 120000);

  afterEach(async () => {
    if (session) {
      console.log('[Test] Closing session...');
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
    }, 60000);
  });

  describe('Models', () => {
    it('User.create should create a user', async () => {
      const email = `nextjs-user-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const u = await User.create({ email: '${email}', password: 'secret123', name: { first: 'N', last: 'J' } }); JSON.stringify({ email: u.email, isActive: u.isActive })`
      );
      expect(result.output).toContain(email);
      expect(result.output).toContain('true');
    });

    it('User.findByEmail should find a user', async () => {
      const email = `nextjs-find-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await User.create({ email: '${email}', password: 'secret123', name: { first: 'F', last: 'B' } })`
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

    it('User instance comparePassword should work', async () => {
      const email = `cmp-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const u = new User({ email: '${email}', password: 'secret', name: { first: 'C', last: 'P' } }); await u.save(); const r = await u.comparePassword('secret'); JSON.stringify({ ok: r })`
      );
      expect(result.output).toContain('"ok":true');
    });
  });

  describe('Services', () => {
    it('userService.create should create a user', async () => {
      const email = `svc-next-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const u = await userService.create({ email: '${email}', password: 'secret123', name: { first: 'S', last: 'V' } }); JSON.stringify({ email: u.email })`
      );
      expect(result.output).toContain(email);
    });

    it('userService.findByEmail should find user', async () => {
      const email = `svc-find-next-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await userService.create({ email: '${email}', password: 'secret123', name: { first: 'S', last: 'F' } })`
      );
      const result = await session.execute(
        `await connectDB(); const u = await userService.findByEmail('${email}'); JSON.stringify({ found: !!u, email: u ? u.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });

    it('userService.authenticate should authenticate a user', async () => {
      const email = `svc-auth-next-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); await userService.create({ email: '${email}', password: 'secret123', name: { first: 'A', last: 'U' } })`
      );
      const result = await session.execute(
        `await connectDB(); const u = await userService.authenticate('${email}', 'secret123'); JSON.stringify({ found: !!u, email: u ? u.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });
  });

  describe('Database Helpers', () => {
    it('connectDB should connect to MongoDB', async () => {
      const result = await session.execute(
        `await connectDB(); const u = await User.findOne(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('connectAll should connect all databases', async () => {
      const result = await session.execute(
        `await connectAll(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('pg should return PostgreSQL connection', async () => {
      const result = await session.execute(
        `await connectAll(); const c = pg(); JSON.stringify({ hasClient: !!c })`
      );
      expect(result.output).toContain('"hasClient":true');
    });

    it('initPostgresTables should create tables', async () => {
      const result = await session.execute(
        `await initPostgresTables(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('ProductRepo.create should create a product', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const p = await ProductRepo.create({ name: 'P1', description: 'D1', price: 9.99, category: 'electronics', stock: 10 }); JSON.stringify({ hasId: !!p.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('ProductRepo.findAll should return products', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const products = await ProductRepo.findAll(); JSON.stringify({ isArray: Array.isArray(products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('initMySQLTables should create tables', async () => {
      const result = await session.execute(
        `await initMySQLTables(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('OrderRepo.create should create an order', async () => {
      const result = await session.execute(
        `await initMySQLTables(); const o = await OrderRepo.createWithItems({ userId: 1, total: 19.99 }, [{ productId: 1, quantity: 1, price: 19.99 }]); JSON.stringify({ hasId: !!o.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('initNeo4jSchema should verify connection', async () => {
      const result = await session.execute(
        `await initNeo4j(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('initDynamoDB should verify connection', async () => {
      const result = await session.execute(
        `await initDynamoDB(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });
  });

  describe('API Helpers', () => {
    it('apiUsersGET should list users', async () => {
      const result = await session.execute(
        `await connectDB(); const r = await apiUsersGET(); JSON.stringify({ isArray: Array.isArray(r.users) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('apiUsersPOST should create a user', async () => {
      const email = `api-post-${Date.now()}@test.com`;
      const result = await session.execute(
        `await connectDB(); const r = await apiUsersPOST({ email: '${email}', password: 'secret123', name: { first: 'A', last: 'P' } }); JSON.stringify({ hasUser: !!r.user })`
      );
      expect(result.output).toContain('"hasUser":true');
    });

    it('apiUsersIdGET should find a user', async () => {
      const email = `api-id-${Date.now()}@test.com`;
      await session.execute(
        `await connectDB(); const u = await userService.create({ email: '${email}', password: 'secret123', name: { first: 'I', last: 'D' } })`
      );
      const result = await session.execute(
        `await connectDB(); const created = await userService.findByEmail('${email}'); const r = await apiUsersIdGET(String(created._id)); JSON.stringify({ hasUser: !!r.user })`
      );
      expect(result.output).toContain('"hasUser":true');
    });

    it('apiProductsGET should list products', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const r = await apiProductsGET(); JSON.stringify({ isArray: Array.isArray(r.products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('apiProductsPOST should create a product', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const r = await apiProductsPOST({ name: 'AP1', price: 9.99, category: 'electronics' }); JSON.stringify({ hasProduct: !!r.product })`
      );
      expect(result.output).toContain('"hasProduct":true');
    });

    it('apiOrdersGET should list orders', async () => {
      const result = await session.execute(
        `await initMySQLTables(); const r = await apiOrdersGET(); JSON.stringify({ isArray: Array.isArray(r.orders) })`
      );
      expect(result.output).toContain('"isArray":true');
    });
  });

  describe('Server Actions - Users', () => {
    it('userGetUsers should return users', async () => {
      const result = await session.execute(
        `const r = await userGetUsers(); JSON.stringify({ isArray: Array.isArray(r) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('userCreateUser should create a user', async () => {
      const result = await session.execute(
        `const r = await userCreateUser({ name: 'Test User', email: 'test-${Date.now()}@example.com', role: 'user' }); JSON.stringify({ hasId: !!r.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('userGetUserById should find a user', async () => {
      const result = await session.execute(
        `const r = await userGetUserById('1'); JSON.stringify({ hasUser: !!r })`
      );
      expect(result.output).toContain('"hasUser":true');
    });

    it('userUpdateUser should update a user', async () => {
      const result = await session.execute(
        `const r = await userUpdateUser('1', { name: 'Updated Name' }); JSON.stringify({ updated: r.name === 'Updated Name' })`
      );
      expect(result.output).toContain('"updated":true');
    });
  });

  describe('Server Actions - Products', () => {
    it('productsGetProducts should return products', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const r = await productsGetProducts(); JSON.stringify({ isArray: Array.isArray(r) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('productsCreateProduct should create a product', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const r = await productsCreateProduct({ name: 'SP1', price: 9.99, category: 'electronics' }); JSON.stringify({ hasId: !!r.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('productsGetProductStats should return stats', async () => {
      const result = await session.execute(
        `await initPostgresTables(); const r = await productsGetProductStats(); JSON.stringify({ isArray: Array.isArray(r) })`
      );
      expect(result.output).toContain('"isArray":true');
    });
  });

  describe('Server Actions - Orders', () => {
    it('ordersGetOrders should return orders', async () => {
      const result = await session.execute(
        `await initMySQLTables(); const r = await ordersGetOrders(); JSON.stringify({ isArray: Array.isArray(r) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('ordersCreateOrder should create an order', async () => {
      const result = await session.execute(
        `await initMySQLTables(); const r = await ordersCreateOrder({ userId: 1, items: [{ productId: 1, quantity: 1, price: 9.99 }] }); JSON.stringify({ hasId: !!r.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });
  });

  describe('Server Actions - Social', () => {
    it('socialCreateSocialUser should create a social user', async () => {
      const id = `soc-${Date.now()}`;
      const result = await session.execute(
        `await initNeo4j(); const r = await socialCreateSocialUser({ id: '${id}', name: 'Social', email: '${id}@test.com' }); JSON.stringify({ hasId: !!r.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('socialGetSocialUser should find a social user', async () => {
      const id = `soc2-${Date.now()}`;
      await session.execute(
        `await initNeo4j(); await socialCreateSocialUser({ id: '${id}', name: 'Social2', email: '${id}@test.com' })`
      );
      const result = await session.execute(
        `await initNeo4j(); const r = await socialGetSocialUser('${id}'); JSON.stringify({ found: !!r })`
      );
      expect(result.output).toContain('"found":true');
    });
  });

  describe('Server Actions - DynamoDB Users', () => {
    it('dynamoUsersCreateDynamoUser should create a user', async () => {
      const result = await session.execute(
        `await initDynamoDB(); const r = await dynamoUsersCreateDynamoUser({ name: 'Dynamo', email: 'dynamo-${Date.now()}@test.com' }); JSON.stringify({ hasId: !!r.id })`
      );
      expect(result.output).toContain('"hasId":true');
    });

    it('dynamoUsersGetDynamoUsers should return users', async () => {
      const result = await session.execute(
        `await initDynamoDB(); const r = await dynamoUsersGetDynamoUsers(); JSON.stringify({ isArray: Array.isArray(r) })`
      );
      expect(result.output).toContain('"isArray":true');
    });
  });

  describe('NodeSH Helpers', () => {
    it('run should execute and log', async () => {
      const result = await session.execute(
        `const r = await run(async () => 42, 'test'); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('measure should return timing result', async () => {
      const result = await session.execute(
        `const r = await measure(async () => 'hello'); JSON.stringify({ hasResult: r.result === 'hello', hasDuration: typeof r.duration === 'number' })`
      );
      expect(result.output).toContain('"hasResult":true');
      expect(result.output).toContain('"hasDuration":true');
    });

    it('batch should run multiple operations', async () => {
      const result = await session.execute(
        `const r = await batch([() => Promise.resolve(1), () => Promise.resolve(2)]); JSON.stringify({ isArray: Array.isArray(r), allSuccess: r.every(x => x.success) })`
      );
      expect(result.output).toContain('"isArray":true');
      expect(result.output).toContain('"allSuccess":true');
    });

    it('retry should succeed on first attempt', async () => {
      const result = await session.execute(
        `const r = await retry(async () => 'ok', 3, 100); JSON.stringify({ ok: r === 'ok' })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('sleep should delay', async () => {
      const result = await session.execute(
        `const start = Date.now(); await sleep(50); JSON.stringify({ delayed: Date.now() - start >= 40 })`
      );
      expect(result.output).toContain('"delayed":true');
    });

    it('seed should create records', async () => {
      const result = await session.execute(
        `await connectDB(); await seed(2); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('clear should run operations', async () => {
      const result = await session.execute(
        `await connectDB(); await clear(); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('showStats should display stats', async () => {
      const result = await session.execute(
        `await connectDB(); await showStats({ users: async () => await User.countDocuments() }); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });

    it('formatTable should format data', async () => {
      const result = await session.execute(
        `const r = formatTable([{ a: 1, b: 2 }]); JSON.stringify({ hasHeader: r.includes('a') })`
      );
      expect(result.output).toContain('"hasHeader":true');
    });

    it('formatBytes should format bytes', async () => {
      const result = await session.execute(
        `const r = formatBytes(1024); JSON.stringify({ isKB: r.includes('KB') })`
      );
      expect(result.output).toContain('"isKB":true');
    });

    it('formatDuration should format duration', async () => {
      const result = await session.execute(
        `const r = formatDuration(1500); JSON.stringify({ hasS: r.includes('s') })`
      );
      expect(result.output).toContain('"hasS":true');
    });

    it.skip('http should make a request', async () => {
      const result = await session.execute(
        `const r = await http.get('http://localhost:9999/health'); JSON.stringify({ ok: true })`
      );
      expect(result.output).toContain('"ok":true');
    });
  });

  describe('General Context', () => {
    it('should expose env, NODE_ENV and nextConfig', async () => {
      const result = await session.execute(
        `JSON.stringify({ hasEnv: !!env, hasNodeEnv: !!NODE_ENV, hasNextConfig: !!nextConfig })`
      );
      expect(result.output).toContain('"hasEnv":true');
      expect(result.output).toContain('"hasNodeEnv":true');
      expect(result.output).toContain('"hasNextConfig":true');
    });
  });
});
