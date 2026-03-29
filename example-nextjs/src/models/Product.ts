/**
 * Product Model for PostgreSQL
 * Used with the ProductRepo in lib/db-postgres.ts
 */

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
}

export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'food',
  'books',
  'home',
  'sports',
  'toys',
  'other',
] as const;

export function validateProduct(data: Partial<Product>): string[] {
  const errors: string[] = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (data.price === undefined || data.price < 0) {
    errors.push('Price must be a positive number');
  }
  
  if (!data.category || !PRODUCT_CATEGORIES.includes(data.category as typeof PRODUCT_CATEGORIES[number])) {
    errors.push(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`);
  }
  
  return errors;
}
