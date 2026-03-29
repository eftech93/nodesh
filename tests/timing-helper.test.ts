/**
 * Unit tests for Timing Helper module
 */

import { run, measure, batch, sleep, retry } from '../src/helpers/timing-helper';

describe('Timing Helpers', () => {
  describe('sleep()', () => {
    it('should delay execution for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });

    it('should resolve with undefined', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });

  describe('measure()', () => {
    it('should measure asynchronous function execution time', async () => {
      const { result, duration } = await measure(async () => {
        await sleep(50);
        return 'done';
      });

      expect(duration).toBeGreaterThanOrEqual(40);
      expect(result).toBe('done');
    });

    it('should return correct result', async () => {
      const { result } = await measure(async () => 42);
      expect(result).toBe(42);
    });

    it('should handle function returning promise', async () => {
      const { result } = await measure(() => Promise.resolve('async result'));
      expect(result).toBe('async result');
    });
  });

  describe('run()', () => {
    it('should execute async function and return result', async () => {
      const result = await run(async () => 'test result', 'Test operation');
      expect(result).toBe('test result');
    });

    it('should execute async function', async () => {
      const result = await run(async () => {
        await sleep(10);
        return 'async result';
      }, 'Async test');
      expect(result).toBe('async result');
    });

    it('should handle errors', async () => {
      await expect(
        run(async () => { throw new Error('Test error'); }, 'Failing operation')
      ).rejects.toThrow('Test error');
    });
  });

  describe('batch()', () => {
    it('should execute all async functions and return results', async () => {
      const results = await batch([
        async () => 1,
        async () => 2,
        async () => 3,
      ]);

      expect(results).toEqual([
        { success: true, result: 1 },
        { success: true, result: 2 },
        { success: true, result: 3 }
      ]);
    });

    it('should execute async functions', async () => {
      const results = await batch([
        async () => { await sleep(10); return 'a'; },
        async () => { await sleep(10); return 'b'; },
        async () => { await sleep(10); return 'c'; },
      ]);

      expect(results).toEqual([
        { success: true, result: 'a' },
        { success: true, result: 'b' },
        { success: true, result: 'c' }
      ]);
    });

    it('should handle empty array', async () => {
      const results = await batch([]);
      expect(results).toEqual([]);
    });

    it('should propagate errors in result objects', async () => {
      const results = await batch([
        async () => 'success',
        async () => { throw new Error('Batch error'); },
        async () => 'also success',
      ]);

      expect(results[0]).toEqual({ success: true, result: 'success' });
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeInstanceOf(Error);
      expect(results[2]).toEqual({ success: true, result: 'also success' });
    });
  });

  describe('retry()', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn, 3);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValue('success');

      const result = await retry(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        retry(fn, 3, 10)
      ).rejects.toThrow('Persistent error');

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect delay between attempts', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const start = Date.now();
      await retry(fn, 2, 100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90);
    });

    it('should handle asynchronous functions', async () => {
      const fn = jest.fn().mockResolvedValue('async result');
      const result = await retry(fn, 1);
      
      expect(result).toBe('async result');
    });
  });
});
