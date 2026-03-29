'use server';

/**
 * Product Server Actions - PostgreSQL
 */

import { pg, ProductRepo, initPostgresTables } from '@/lib/db-postgres';
import { validateProduct } from '@/models/Product';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initPostgresTables();
    initialized = true;
  }
}

export async function getProducts(limit = 100) {
  'use server';
  await ensureTables();
  return ProductRepo.findAll(limit);
}

export async function getProductById(id: number) {
  'use server';
  await ensureTables();
  return ProductRepo.findById(id);
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
}) {
  'use server';
  await ensureTables();
  
  const errors = validateProduct(data);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return ProductRepo.create(data);
}

export async function updateProduct(
  id: number,
  data: Partial<{ name: string; price: number; stock: number }>
) {
  'use server';
  await ensureTables();
  return ProductRepo.update(id, data);
}

export async function deleteProduct(id: number) {
  'use server';
  await ensureTables();
  return ProductRepo.delete(id);
}

export async function searchProducts(query: string) {
  'use server';
  await ensureTables();
  return ProductRepo.search(query);
}

export async function getProductsByCategory(category: string) {
  'use server';
  await ensureTables();
  const result = await pg.query(
    'SELECT * FROM products WHERE category = $1',
    [category]
  );
  return result.rows;
}

export async function getProductStats() {
  'use server';
  await ensureTables();
  const result = await pg.query(`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price
    FROM products
    GROUP BY category
  `);
  return result.rows;
}

export async function getLowStockProducts(threshold = 10) {
  'use server';
  await ensureTables();
  const result = await pg.query(
    'SELECT * FROM products WHERE stock <= $1 ORDER BY stock ASC',
    [threshold]
  );
  return result.rows;
}
