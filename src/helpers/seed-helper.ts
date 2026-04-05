/**
 * Database Seeding Helpers for NodeSH
 */

export interface SeederConfig {
  /** Number of records to create */
  count: number;
  /** Batch size for bulk operations */
  batchSize?: number;
  /** Delay between batches (ms) */
  delayBetweenBatches?: number;
}

export interface SeederContext {
  /** Current batch number */
  batchNumber: number;
  /** Total records created so far */
  totalCreated: number;
  /** Total records to create */
  totalTarget: number;
}

/**
 * Generic seeder function
 * 
 * @example
 * await seed({
 *   count: 100,
 *   create: (index) => User.create({ name: `User ${index}` }),
 *   onProgress: (ctx) => console.log(`${ctx.totalCreated}/${ctx.totalTarget}`)
 * });
 */
export async function seed<T>(options: {
  count: number;
  create: (index: number) => Promise<T>;
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (context: SeederContext) => void;
  onError?: (error: Error, index: number) => void;
}): Promise<{ created: T[]; failed: number }> {
  const {
    count,
    create,
    batchSize = 10,
    delayBetweenBatches = 0,
    onProgress,
    onError,
  } = options;

  console.log(`🌱 Seeding ${count} records...`);
  const start = Date.now();
  
  const created: T[] = [];
  let failed = 0;
  let batchNumber = 0;

  for (let i = 0; i < count; i += batchSize) {
    batchNumber++;
    const batch = [];
    const currentBatchSize = Math.min(batchSize, count - i);

    for (let j = 0; j < currentBatchSize; j++) {
      const index = i + j;
      batch.push(
        Promise.resolve(create(index)).catch((error) => {
          failed++;
          onError?.(error as Error, index);
          return null;
        })
      );
    }

    const results = await Promise.all(batch);
    for (const r of results) {
      if (r !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        created.push(r as any);
      }
    }

    if (onProgress) {
      onProgress({
        batchNumber,
        totalCreated: created.length,
        totalTarget: count,
      });
    }

    if (delayBetweenBatches > 0 && i + batchSize < count) {
      await sleep(delayBetweenBatches);
    }
  }

  const duration = Date.now() - start;
  console.log(`✅ Seeding complete: ${created.length} created, ${failed} failed (${duration}ms)`);

  return { created, failed };
}

/**
 * Seed users with faker-like data
 */
export async function seedUsers(options: {
  count: number;
  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => Promise<unknown>;
  roles?: string[];
}): Promise<void> {
  const firstNames = [
    'John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 
    'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 
    'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'
  ];
  
  const { count, create, roles = ['user'] } = options;

  await seed({
    count,
    create: (i) => {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const role = roles[i % roles.length];
      
      return create({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        firstName,
        lastName,
        role,
      });
    },
    batchSize: 10,
  });
}

/**
 * Clear collections/data
 * 
 * @example
 * await clear([
 *   () => User.deleteMany({}),
 *   () => Order.deleteMany({}),
 *   () => redis.flushall(),
 * ]);
 */
export async function clear(
  operations: Array<() => Promise<unknown>> = [],
  options: {
    label?: string;
    confirm?: boolean;
  } = {}
): Promise<void> {
  const { label = 'database', confirm = false } = options;

  if (confirm) {
    console.log(`⚠️  This will clear all ${label} data!`);
    // In REPL context, we can't really prompt, so just log
  }

  console.log(`🧹 Clearing ${label}...`);
  const start = Date.now();

  await Promise.all(
    operations.map(async (op) => {
      try {
        await op();
      } catch (e) {
        console.warn('Clear operation failed:', (e as Error).message);
      }
    })
  );

  const duration = Date.now() - start;
  console.log(`✅ Cleared (${duration}ms)`);
}

/**
 * Show database statistics
 * 
 * @example
 * await showStats({
 *   users: () => User.countDocuments(),
 *   orders: () => Order.countDocuments(),
 * });
 */
export async function showStats(
  counters: Record<string, () => Promise<number | unknown>>
): Promise<void> {
  console.log('\n📊 Statistics:');
  
  const entries = Object.entries(counters);
  const results = await Promise.all(
    entries.map(async ([name, fn]) => {
      try {
        const value = await fn();
        return { name, value };
      } catch (e) {
        return { name, value: 'error' };
      }
    })
  );

  results.forEach(({ name, value }) => {
    console.log(`  ${name}: ${value}`);
  });
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
