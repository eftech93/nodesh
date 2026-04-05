/**
 * NestJS Integration Tests
 *
 * Comprehensive execution tests for all generated console methods in the example-nestjs project.
 */

import { CLISession, waitForDatabases, setupTestEnv } from './cli-harness';
import * as path from 'path';

declare global {
  var __nestUserId: string;
  var __nestGetId: string;
  var __nestPatchId: string;
  var __nestDelId: string;
}

const projectPath = path.join(__dirname, '../../example-nestjs');

(process.env.ENABLE_INTEGRATION_TESTS === 'true' ? describe : describe.skip)('NestJS Integration Tests', () => {
  let session: CLISession;

  beforeAll(async () => {
    setupTestEnv();
    await waitForDatabases();
  }, 120000);

  beforeEach(async () => {
    session = await CLISession.create({
      projectPath,
      commandTimeout: 60000
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
    });
  });

  describe('Entities', () => {
    it('should expose all entity models', async () => {
      const entities = ['User', 'Order', 'Product', 'Customer', 'Inventory'];
      for (const entity of entities) {
        const result = await session.execute(`typeof ${entity}`);
        expect(result.output).toMatch(/function|object/);
      }
    });
  });

  describe('Services', () => {
    it('usersService.create should create a user', async () => {
      const email = `nest-user-${Date.now()}@test.com`;
      const result = await session.execute(
        `const u = await usersService.create({ email: '${email}', password: 'pw', name: { first: 'N', last: 'S' } }); JSON.stringify({ email: u.email })`
      );
      expect(result.output).toContain(email);
    });

    it('usersService.findAll should return paginated users', async () => {
      const result = await session.execute(
        `const r = await usersService.findAll({ page: 1, limit: 5 }); JSON.stringify({ hasUsers: Array.isArray(r.users), hasPagination: !!r.pagination })`
      );
      expect(result.output).toContain('"hasUsers":true');
      expect(result.output).toContain('"hasPagination":true');
    });

    it('usersService.findById should find a user', async () => {
      const email = `nest-find-${Date.now()}@test.com`;
      await session.execute(`const u = await usersService.create({ email: '${email}', password: 'pw', name: { first: 'F', last: 'D' } }); global.__nestUserId = u._id.toString()`);
      const result = await session.execute(
        `const foundUser = await usersService.findById(global.__nestUserId); JSON.stringify({ found: !!foundUser, email: foundUser ? foundUser.email : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain(email);
    });

    it('usersService.getStats should return stats', async () => {
      const result = await session.execute(
        `const s = await usersService.getStats(); JSON.stringify({ hasTotal: typeof s.total === 'number' })`
      );
      expect(result.output).toContain('"hasTotal":true');
    });

    it('productsService.create should create a product', async () => {
      const sku = `NEST-SKU-${Date.now()}`;
      const result = await session.execute(
        `const p = await productsService.create({ sku: '${sku}', name: 'Nest Product', description: 'Desc', price: 49.99, category: 'test' }); JSON.stringify({ sku: p.sku, name: p.name })`
      );
      expect(result.output).toContain(sku);
      expect(result.output).toContain('Nest Product');
    });

    it('productsService.findAll should return products', async () => {
      const result = await session.execute(
        `const products = await productsService.findAll({}); JSON.stringify({ isArray: Array.isArray(products) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('customersService.findAll should return customers', async () => {
      const result = await session.execute(
        `const customers = await customersService.findAll(); JSON.stringify({ isArray: Array.isArray(customers) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('customersService.create should create a customer', async () => {
      const email = `nest-customer-${Date.now()}@test.com`;
      const result = await session.execute(
        `const c = await customersService.create({ email: '${email}', firstName: 'Nest', lastName: 'Customer', phone: '555-0100' }); JSON.stringify({ email: c.email })`
      );
      expect(result.output).toContain(email);
    });

    it('inventoryService.findAll should return inventory', async () => {
      const result = await session.execute(
        `const items = await inventoryService.findAll(); JSON.stringify({ isArray: Array.isArray(items) })`
      );
      expect(result.output).toContain('"isArray":true');
    });

    it('inventoryService.findBySku should find an item', async () => {
      const result = await session.execute(
        `const item = await inventoryService.findBySku('LAPTOP-001'); JSON.stringify({ found: !!item, sku: item ? item.sku : null })`
      );
      expect(result.output).toContain('"found":true');
      expect(result.output).toContain('LAPTOP-001');
    });

    it('cacheService.set and get should work', async () => {
      const key = `nest-cache-${Date.now()}`;
      await session.execute(`await cacheService.set('${key}', { value: 123 })`);
      const result = await session.execute(`const v = await cacheService.get('${key}'); JSON.stringify(v)`);
      expect(result.output).toContain('"value":123');
    });

    it('cacheService.exists should return true for existing key', async () => {
      const key = `nest-exists-${Date.now()}`;
      await session.execute(`await cacheService.set('${key}', 'hello')`);
      const result = await session.execute(`const v = await cacheService.exists('${key}'); JSON.stringify({ exists: v })`);
      expect(result.output).toContain('"exists":true');
    });

    it('apiService.ping should measure latency', async () => {
      const cmd = `
await (async () => {
  await nestApp.listen(3456);
  try {
    const r = await apiService.ping('http://localhost:3456/health');
    return JSON.stringify({ success: r.success, status: r.status });
  } finally {
    try { await nestApp.close(); } catch (e) {}
  }
})()
      `.trim();
      const result = await session.execute(cmd);
      expect(result.output).toContain('"success":true');
      expect(result.output).toContain('"status":200');
    });
  });

  describe('Service Short Names', () => {
    it('should alias short names to full service names', async () => {
      const aliases = [
        { short: 'api', full: 'apiService' },
        { short: 'cache', full: 'cacheService' },
        { short: 'customers', full: 'customersService' },
        { short: 'inventory', full: 'inventoryService' },
        { short: 'orders', full: 'ordersService' },
        { short: 'products', full: 'productsService' },
        { short: 'recommendations', full: 'recommendationsService' },
        { short: 'users', full: 'usersService' },
        { short: 'analytics', full: 'analyticsService' },
      ];
      for (const { short, full } of aliases) {
        const result = await session.execute(`${short} === ${full}`);
        expect(result.output).toContain('true');
      }
    });
  });

  describe('Endpoints', () => {
    function nestjsEndpoint(method: string, path: string, body?: Record<string, unknown>) {
      const bodyStr = body
        ? `, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${JSON.stringify(body).replace(/'/g, "\\'")})`
        : '';
      return `
await (async () => {
  await nestApp.listen(3456);
  try {
    const res = await fetch(\`http://localhost:3456${path}\`, { method: '${method}'${bodyStr} });
    let data;
    try { data = await res.json(); } catch (e) { data = await res.text().catch(() => ''); }
    console.log(JSON.stringify({ status: res.status, body: data }));
  } finally {
    try { await nestApp.close(); } catch (e) {}
  }
})()
      `.trim();
    }

    it('GET /health should return ok', async () => {
      const result = await session.execute(nestjsEndpoint('GET', '/health'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('"status":"ok"');
    });

    it('POST /users should create a user', async () => {
      const email = `nest-endpoint-${Date.now()}@test.com`;
      const result = await session.execute(
        nestjsEndpoint('POST', '/users', { email, password: 'pw', name: { first: 'E', last: 'P' } })
      );
      expect(result.output).toContain('"status":201');
      expect(result.output).toContain(email);
    });

    it('GET /users should list users', async () => {
      const result = await session.execute(nestjsEndpoint('GET', '/users?page=1&limit=5'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('users');
      expect(result.output).toContain('pagination');
    });

    it('GET /users/:id should return a user', async () => {
      const email = `nest-getid-${Date.now()}@test.com`;
      await session.execute(`const u = await usersService.create({ email: '${email}', password: 'pw', name: { first: 'G', last: 'I' } }); global.__nestGetId = u._id.toString()`);
      const result = await session.execute(nestjsEndpoint('GET', '/users/${global.__nestGetId}'));
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain(email);
    });

    it('PATCH /users/:id should update a user', async () => {
      const email = `nest-patch-${Date.now()}@test.com`;
      await session.execute(`const u = await usersService.create({ email: '${email}', password: 'pw', name: { first: 'P', last: 'A' } }); global.__nestPatchId = u._id.toString()`);
      const result = await session.execute(
        nestjsEndpoint('PATCH', '/users/${global.__nestPatchId}', { name: { first: 'Updated', last: 'Name' } })
      );
      expect(result.output).toContain('"status":200');
      expect(result.output).toContain('Updated');
    });

    it('DELETE /users/:id should remove a user', async () => {
      const email = `nest-del-${Date.now()}@test.com`;
      await session.execute(`const u = await usersService.create({ email: '${email}', password: 'pw', name: { first: 'D', last: 'E' } }); global.__nestDelId = u._id.toString()`);
      const result = await session.execute(nestjsEndpoint('DELETE', '/users/${global.__nestDelId}'));
      expect(result.output).toContain('"status":200');
    });

  });

  describe('Controllers', () => {
    it('should expose queueDashboardController', async () => {
      const result = await session.execute('typeof queueDashboardController');
      expect(result.output).toMatch(/object|function/);
    });

    it('should expose healthController', async () => {
      const result = await session.execute('typeof healthController');
      expect(result.output).toMatch(/object/);
    });
  });

  describe('General Context', () => {
    it('should expose env and NODE_ENV', async () => {
      const result1 = await session.execute('typeof env');
      expect(result1.output).toContain('object');
      const result2 = await session.execute('typeof NODE_ENV');
      expect(result2.output).toContain('string');
    });
  });
});
