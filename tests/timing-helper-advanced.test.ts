/**
 * Additional unit tests for Timing Helper module
 * Covers debounce, throttle, withTimeout, sequence
 */

import { 
  debounce, 
  throttle, 
  withTimeout, 
  sequence 
} from '../src/helpers/timing-helper';

describe('Timing Helpers - Advanced', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce()', () => {
    it('should delay function execution', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1');
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    it('should reset timer on subsequent calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      jest.advanceTimersByTime(50);
      
      debounced('second');
      jest.advanceTimersByTime(50);
      
      // First call should not have executed yet
      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });

    it('should pass multiple arguments', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2', 123);
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should handle multiple calls with only last executing', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced(1);
      debounced(2);
      debounced(3);
      
      jest.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });
  });

  describe('throttle()', () => {
    it('should execute function immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('first');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('first');
    });

    it('should ignore calls during throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled(1);
      throttled(2);
      throttled(3);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('should execute again after throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('first');
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      
      throttled('second');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('second');
    });

    it('should pass multiple arguments on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('a', 'b', { obj: true });
      
      expect(fn).toHaveBeenCalledWith('a', 'b', { obj: true });
    });
  });

  describe('withTimeout()', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });

    it('should reject when promise takes longer than timeout', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000);
      });

      const timeoutPromise = withTimeout(slowPromise, 100);
      jest.advanceTimersByTime(100);

      await expect(timeoutPromise).rejects.toThrow('Operation timed out');
    });

    it('should use custom error message', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000);
      });

      const timeoutPromise = withTimeout(slowPromise, 100, 'Custom timeout message');
      jest.advanceTimersByTime(100);

      await expect(timeoutPromise).rejects.toThrow('Custom timeout message');
    });

    it('should reject with original error if promise rejects', async () => {
      const failingPromise = Promise.reject(new Error('Original error'));

      await expect(withTimeout(failingPromise, 1000)).rejects.toThrow('Original error');
    });

    it('should handle synchronous resolution', async () => {
      const immediate = Promise.resolve('immediate');
      const result = await withTimeout(immediate, 5000);
      
      expect(result).toBe('immediate');
    });
  });

  describe('sequence()', () => {
    it('should execute functions sequentially', async () => {
      const order: number[] = [];
      
      const results = await sequence([
        async () => { order.push(1); return 'a'; },
        async () => { order.push(2); return 'b'; },
        async () => { order.push(3); return 'c'; },
      ]);

      expect(results).toEqual(['a', 'b', 'c']);
      expect(order).toEqual([1, 2, 3]);
    });

    it('should stop on first error', async () => {
      const fn1 = jest.fn().mockResolvedValue('first');
      const fn2 = jest.fn().mockRejectedValue(new Error('Sequence failed'));
      const fn3 = jest.fn().mockResolvedValue('third');

      await expect(sequence([fn1, fn2, fn3])).rejects.toThrow('Sequence failed');
      
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).not.toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      const results = await sequence([]);
      expect(results).toEqual([]);
    });

    it('should handle single function', async () => {
      const fn = jest.fn().mockResolvedValue('single');
      
      const results = await sequence([fn]);
      
      expect(results).toEqual(['single']);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
