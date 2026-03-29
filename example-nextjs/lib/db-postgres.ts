/**
 * PostgreSQL Database Connection Example
 * 
 * This file demonstrates how to use NodeSH's PostgreSQL adapter
 * for direct SQL queries in your Next.js application.
 * 
 * Usage in NodeSH console:
 *   > await pg.query('SELECT * FROM users WHERE id = $1', [1])
 *   > await pg.getTables()
 *   > await pg.getStats()
 */

import { createPostgreSQLConnectionFromEnv } from '@eftech93/nodesh';

// Create PostgreSQL connection using environment variables
// Required env vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// Or use: DATABASE_URL (postgres://...)

export const pg = createPostgreSQLConnectionFromEnv();

/**
 * Example: User repository with PostgreSQL
 */
export const UserRepo = {
  async findById(id: number) {
    const result = await pg.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findAll(limit = 100) {
    const result = await pg.query('SELECT * FROM users LIMIT $1', [limit]);
    return result.rows;
  },

  async create(data: { name: string; email: string; role?: string }) {
    const result = await pg.query(
      'INSERT INTO users (name, email, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [data.name, data.email, data.role || 'user']
    );
    return result.rows[0];
  },

  async update(id: number, data: Partial<{ name: string; email: string; role: string }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.role) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await pg.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number) {
    const result = await pg.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return (result.rowCount || 0) > 0;
  },

  async search(query: string) {
    const result = await pg.query(
      "SELECT * FROM users WHERE name ILIKE $1 OR email ILIKE $1",
      [`%${query}%`]
    );
    return result.rows;
  },

  async count() {
    const result = await pg.query('SELECT COUNT(*) as count FROM users');
    return parseInt((result.rows[0] as { count: string }).count);
  },
};

/**
 * Initialize PostgreSQL tables
 */
export async function initPostgresTables(): Promise<void> {
  await pg.connect();

  // Create users table if not exists
  await pg.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create orders table if not exists
  await pg.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'pending',
      total DECIMAL(10, 2),
      items JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('✅ PostgreSQL tables initialized');
}

// Re-export for convenience
export { createPostgreSQLConnectionFromEnv };
