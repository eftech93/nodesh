/**
 * PostgreSQL Database Connection
 * Uses the NodeSH PostgreSQL adapter
 */

import { createPostgreSQLConnectionFromEnv, PostgreSQLConnection } from '@eftech93/nodesh';
import { Product, ProductInput } from '@/models/Product';

// Export the raw pg client for advanced queries
export let pg: any;

// Connection instance
let connection: PostgreSQLConnection | null = null;

export async function connectPostgres(): Promise<PostgreSQLConnection> {
  if (!connection) {
    connection = await createPostgreSQLConnectionFromEnv();
    pg = (connection as any).client;
  }
  return connection;
}

// Initialize tables
export async function initPostgresTables(): Promise<void> {
  const conn = await connectPostgres();
  const client = (conn as any).client;
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      stock INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Product Repository
export const ProductRepo = {
  async create(data: ProductInput): Promise<Product> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const result = await client.query(
      `INSERT INTO products (name, description, price, category, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.description, data.price, data.category, data.stock || 0]
    );
    return result.rows[0];
  },
  
  async findAll(limit = 100): Promise<Product[]> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const result = await client.query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
  
  async findById(id: number): Promise<Product | null> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const result = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },
  
  async update(id: number, data: Partial<ProductInput>): Promise<Product | null> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;
    
    if (data.name) { fields.push(`name = $${paramIdx++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIdx++}`); values.push(data.description); }
    if (data.price !== undefined) { fields.push(`price = $${paramIdx++}`); values.push(data.price); }
    if (data.category) { fields.push(`category = $${paramIdx++}`); values.push(data.category); }
    if (data.stock !== undefined) { fields.push(`stock = $${paramIdx++}`); values.push(data.stock); }
    
    fields.push(`updated_at = $${paramIdx++}`);
    values.push(new Date().toISOString());
    values.push(id);
    
    const result = await client.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },
  
  async delete(id: number): Promise<boolean> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const result = await client.query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },
  
  async search(query: string): Promise<Product[]> {
    const conn = await connectPostgres();
    const client = (conn as any).client;
    
    const result = await client.query(
      `SELECT * FROM products 
       WHERE name ILIKE $1 OR description ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    return result.rows;
  },
};
