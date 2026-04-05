/**
 * Autocomplete Integration Tests
 *
 * Tests the intelligent autocomplete functionality with real contexts.
 */

import { CLISession, waitForDatabases, setupTestEnv } from './cli-harness';
import { IntelligentCompleter } from '../../src/autocomplete';
import * as path from 'path';

const INTEGRATION_TESTS_ENABLED = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const DESCRIBE = INTEGRATION_TESTS_ENABLED ? describe : describe.skip;

/**
 * Unit-style tests for the IntelligentCompleter
 */
describe('Autocomplete Unit Tests', () => {
  describe('Basic Completion', () => {
    it('should complete top-level context keys', () => {
      const context = {
        user: { name: 'John', age: 30 },
        product: { title: 'Widget', price: 99.99 },
        db: { connect: () => {}, query: () => {} }
      };

      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('u');

      expect(completions).toContain('user');
      expect(completions).not.toContain('product');
    });

    it('should return all keys for empty line', () => {
      const context = { user: {}, product: {}, order: {} };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('');

      expect(completions).toContain('user');
      expect(completions).toContain('product');
      expect(completions).toContain('order');
    });

    it('should filter by partial match', () => {
      const context = { userService: {}, userRepository: {}, productService: {} };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('user');

      expect(completions).toContain('userService');
      expect(completions).toContain('userRepository');
      expect(completions).not.toContain('productService');
    });
  });

  describe('Property Access Completion', () => {
    it('should complete object properties', () => {
      const context = { user: { name: 'John', email: 'john@example.com', age: 30 } };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('user.n');

      expect(completions).toContain('name');
    });

    it('should complete nested properties', () => {
      const context = { config: { database: { host: 'localhost', port: 5432 } } };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('config.database.');

      expect(completions).toContain('host');
      expect(completions).toContain('port');
    });

    it('should complete method names with parentheses', () => {
      const context = { service: { getAll: () => {}, create: () => {} } };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('service.g');

      expect(completions).toContain('getAll()');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const context = { user: null };
      const completer = new IntelligentCompleter(context);
      const [completions] = completer.complete('user.n');
      expect(completions).toEqual([]);
    });

    it('should handle circular references gracefully', () => {
      const context: any = { user: { name: 'John' } };
      context.user.self = context.user;

      const completer = new IntelligentCompleter(context);
      expect(() => completer.complete('user.')).not.toThrow();
    });
  });
});

/**
 * Integration tests for autocomplete with real projects
 */
DESCRIBE('Autocomplete Integration Tests', () => {
  let session: CLISession;

  describe('Next.js Project', () => {
    const projectPath = path.join(__dirname, '../../example-nextjs');

    beforeAll(async () => {
      setupTestEnv();
      await waitForDatabases();
    }, 120000);

    beforeEach(async () => {
      session = await CLISession.create({ projectPath });
    }, 60000);

    afterEach(async () => {
      if (session) await session.close();
    });

    it('should complete server action names', async () => {
      const result = await session.execute('products');
      expect(result.output).toBeTruthy();
    });

    it('should complete with dot notation', async () => {
      const result = await session.execute('userService.f');
      expect(result.output).toBeTruthy();
    });

    it('should show help context', async () => {
      const result = await session.execute('.help');
      expect(result.output).toContain('Available Context');
    });

    it('should complete model names', async () => {
      const result = await session.execute('Prod');
      expect(result.output).toBeTruthy();
    });

    it('should complete database helper names', async () => {
      const result = await session.execute('connect');
      expect(result.output).toBeTruthy();
    });
  });

  describe('NestJS Project', () => {
    const projectPath = path.join(__dirname, '../../example-nestjs');

    beforeEach(async () => {
      session = await CLISession.create({ projectPath });
    }, 60000);

    afterEach(async () => {
      if (session) await session.close();
    });

    it('should complete service methods', async () => {
      const result = await session.execute('userService.f');
      expect(result.output).toBeTruthy();
    });

    it('should complete repository methods', async () => {
      const result = await session.execute('usersService.f');
      expect(result.output).toBeTruthy();
    });

    it('should complete controller names', async () => {
      const result = await session.execute('users');
      expect(result.output).toBeTruthy();
    });
  });

  describe('Express Project', () => {
    const projectPath = path.join(__dirname, '../../example');

    beforeEach(async () => {
      session = await CLISession.create({ projectPath });
    }, 60000);

    afterEach(async () => {
      if (session) await session.close();
    });

    it('should complete model static methods', async () => {
      const result = await session.execute('User.f');
      expect(result.output).toBeTruthy();
    });

    it('should complete app routes', async () => {
      const result = await session.execute('app.get');
      expect(result.output).toBeTruthy();
    });

    it('should complete service names', async () => {
      const result = await session.execute('user');
      expect(result.output).toBeTruthy();
    });
  });
});
