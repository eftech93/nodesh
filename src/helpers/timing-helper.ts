/**
 * Timing and Performance Helpers for NodeSH
 */

export interface TimingResult<T> {
  result: T;
  duration: number;
}

/**
 * Execute a function and measure its execution time
 * 
 * @example
 * const { result, duration } = await measure(() => User.find());
 * console.log(`Query took ${duration}ms`);
 */
export async function measure<T>(fn: () => Promise<T>): Promise<TimingResult<T>> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Run a function with console logging and timing
 * 
 * @example
 * await run(() => UserService.findAll(), 'Find all users');
 * // Output: ⏳ Running: Find all users
 * //         ✅ Completed in 45ms
 */
export async function run<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const name = label || fn.toString().slice(0, 50) + '...';
  
  console.log(`⏳ Running: ${name}`);
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`✅ Completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Execute multiple operations in batch
 * 
 * @example
 * await batch([
 *   () => User.findById('1'),
 *   () => User.findById('2'),
 *   () => User.findById('3'),
 * ]);
 */
export async function batch<T>(
  fns: Array<() => Promise<T>>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  console.log(`⏳ Running ${fns.length} operations in batch...`);
  const start = Date.now();
  
  const results = await Promise.all(
    fns.map(async (fn) => {
      try {
        const result = await fn();
        return { success: true as const, result };
      } catch (error) {
        return { success: false as const, error: error as Error };
      }
    })
  );
  
  const duration = Date.now() - start;
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Batch completed in ${duration}ms (${successCount}/${fns.length} succeeded)`);
  
  return results;
}

/**
 * Run operations sequentially with delay between them
 * 
 * @example
 * await sequence([
 *   () => User.create({ name: 'User 1' }),
 *   () => User.create({ name: 'User 2' }),
 * ], 100); // 100ms delay between operations
 */
export async function sequence<T>(
  fns: Array<() => Promise<T>>,
  delayMs = 0
): Promise<T[]> {
  console.log(`⏳ Running ${fns.length} operations sequentially...`);
  const start = Date.now();
  const results: T[] = [];
  
  for (let i = 0; i < fns.length; i++) {
    try {
      const result = await fns[i]();
      results.push(result);
      
      if (delayMs > 0 && i < fns.length - 1) {
        await sleep(delayMs);
      }
    } catch (error) {
      console.error(`❌ Operation ${i + 1} failed:`, error);
      throw error;
    }
  }
  
  const duration = Date.now() - start;
  console.log(`✅ Sequence completed in ${duration}ms`);
  return results;
}

/**
 * Retry a function multiple times before failing
 * 
 * @example
 * const result = await retry(() => fetchData(), 3, 1000);
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️  Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }
  
  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Timeout wrapper for promises
 * 
 * @example
 * const result = await withTimeout(fetchData(), 5000, 'Fetch timed out');
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}
