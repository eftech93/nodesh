/**
 * Unit tests for Seed Helper module
 */

import { seed, clear, showStats, seedUsers } from '../src/helpers/seed-helper';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleTable = console.table;

describe('Seed Helpers', () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.table = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.table = originalConsoleTable;
  });

  describe('seed()', () => {
    it('should create specified number of items', async () => {
      const createFn = jest.fn(async (i: number) => ({ id: i, name: `Item ${i}` }));
      
      const { created } = await seed({
        count: 5,
        create: createFn,
      });

      expect(created).toHaveLength(5);
      expect(createFn).toHaveBeenCalledTimes(5);
    });

    it('should create items asynchronously', async () => {
      let counter = 0;
      const createFn = jest.fn(async (i: number) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return { id: ++counter, index: i };
      });

      const { created } = await seed({
        count: 3,
        create: createFn,
      });

      expect(created).toHaveLength(3);
      expect(counter).toBe(3);
    });

    it('should call onProgress during seeding', async () => {
      const progressFn = jest.fn();
      
      await seed({
        count: 10,
        create: async (i) => ({ id: i }),
        batchSize: 3,
        onProgress: progressFn,
      });

      expect(progressFn).toHaveBeenCalled();
    });

    it('should process in batches', async () => {
      const createFn = jest.fn(async (i) => {
        return { id: i };
      });

      await seed({
        count: 10,
        create: createFn,
        batchSize: 3,
      });

      expect(createFn).toHaveBeenCalledTimes(10);
    });

    it('should handle count of 0', async () => {
      const createFn = jest.fn();
      
      const { created } = await seed({
        count: 0,
        create: createFn,
      });

      expect(created).toHaveLength(0);
      expect(createFn).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { created, failed } = await seed({
        count: 5,
        create: async (i) => {
          if (i === 2) throw new Error('Creation error');
          return { id: i };
        },
      });

      expect(created).toHaveLength(4);
      expect(failed).toBe(1);
    });
  });

  describe('seedUsers()', () => {
    it('should create users with generated data', async () => {
      const createFn = jest.fn(async (data) => ({ ...data, id: '123' }));
      
      await seedUsers({
        count: 3,
        create: createFn,
      });

      expect(createFn).toHaveBeenCalledTimes(3);
      expect(createFn).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('@'),
          firstName: expect.any(String),
          lastName: expect.any(String),
        })
      );
    });

    it('should assign specified roles', async () => {
      const createFn = jest.fn();
      
      await seedUsers({
        count: 6,
        create: createFn,
        roles: ['admin', 'user', 'moderator'],
      });

      const calls = createFn.mock.calls;
      const roles = calls.map(call => call[0].role);
      
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
      expect(roles).toContain('moderator');
    });
  });

  describe('clear()', () => {
    it('should execute all clear operations', async () => {
      const op1 = jest.fn().mockResolvedValue(undefined);
      const op2 = jest.fn().mockResolvedValue(undefined);
      const op3 = jest.fn().mockResolvedValue(undefined);

      await clear([op1, op2, op3]);

      expect(op1).toHaveBeenCalled();
      expect(op2).toHaveBeenCalled();
      expect(op3).toHaveBeenCalled();
    });

    it('should handle empty operations array', async () => {
      await expect(clear([])).resolves.not.toThrow();
    });

    it('should handle errors in operations gracefully', async () => {
      const op1 = jest.fn().mockResolvedValue(undefined);
      const op2 = jest.fn().mockRejectedValue(new Error('Clear failed'));

      // Should not throw, just warn
      await clear([op1, op2]);

      expect(op1).toHaveBeenCalled();
      expect(op2).toHaveBeenCalled();
    });
  });

  describe('showStats()', () => {
    it('should display statistics', async () => {
      const counters = {
        users: jest.fn().mockResolvedValue(100),
        orders: jest.fn().mockResolvedValue(500),
      };

      await showStats(counters);

      expect(counters.users).toHaveBeenCalled();
      expect(counters.orders).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle async counters', async () => {
      const counters = {
        asyncCount: async () => 100,
      };

      await showStats(counters);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle zero counts', async () => {
      const counters = {
        empty: jest.fn().mockResolvedValue(0),
      };

      await showStats(counters);

      expect(counters.empty).toHaveBeenCalled();
    });

    it('should handle errors in counters gracefully', async () => {
      const counters = {
        good: jest.fn().mockResolvedValue(100),
        bad: jest.fn().mockRejectedValue(new Error('Count failed')),
      };

      await showStats(counters);

      // Should not throw, just show 'error' for failed counter
      expect(console.log).toHaveBeenCalled();
    });
  });
});
