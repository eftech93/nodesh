/**
 * MySQL Database Connection Example
 * 
 * This file demonstrates how to use NodeSH's MySQL adapter
 * for direct SQL queries in your Next.js application.
 * 
 * Usage in NodeSH console:
 *   > await mysql.query('SELECT * FROM users WHERE id = ?', [1])
 *   > await mysql.getTables()
 *   > await mysql.getStats()
 */

import { createMySQLConnectionFromEnv } from '@eftech93/nodesh';

// Create MySQL connection using environment variables
// Required env vars: MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD
// Or use: DATABASE_URL (mysql://...)

export const mysql = createMySQLConnectionFromEnv();

/**
 * Example: Product repository with MySQL
 */
export const ProductRepo = {
  async findById(id: number) {
    const rows = await mysql.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findAll(limit = 100) {
    return mysql.query('SELECT * FROM products LIMIT ?', [limit]);
  },

  async findByCategory(category: string) {
    return mysql.query('SELECT * FROM products WHERE category = ?', [category]);
  },

  async create(data: { 
    name: string; 
    description?: string;
    price: number;
    category: string;
    stock?: number;
  }) {
    const result = await mysql.execute(
      'INSERT INTO products (name, description, price, category, stock) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.description || null, data.price, data.category, data.stock || 0]
    );
    return { id: result.insertId, ...data };
  },

  async update(id: number, data: Partial<{ name: string; price: number; stock: number }>) {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.stock !== undefined) {
      fields.push('stock = ?');
      values.push(data.stock);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await mysql.execute(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async delete(id: number) {
    const result = await mysql.execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async search(query: string) {
    return mysql.query(
      "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
      [`%${query}%`, `%${query}%`]
    );
  },

  async getLowStock(threshold = 10) {
    return mysql.query('SELECT * FROM products WHERE stock <= ?', [threshold]);
  },
};

/**
 * Example: Order repository with transactions
 */
export const OrderRepo = {
  async createWithItems(
    orderData: { userId: number; total: number },
    items: Array<{ productId: number; quantity: number; price: number }>
  ) {
    const conn = await mysql.getConnection();
    
    try {
      // Start transaction
      await conn.query('START TRANSACTION');

      // Create order
      const [orderResult] = await conn.execute(
        'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
        [orderData.userId, orderData.total, 'pending']
      );
      const orderId = (orderResult as { insertId: number }).insertId;

      // Create order items
      for (const item of items) {
        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.productId, item.quantity, item.price]
        );

        // Update stock
        await conn.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }

      // Commit
      await conn.query('COMMIT');
      
      return { orderId, ...orderData, items };
    } catch (error) {
      await conn.query('ROLLBACK');
      throw error;
    } finally {
      conn.release();
    }
  },
};

/**
 * Initialize MySQL tables
 */
export async function initMySQLTables(): Promise<void> {
  await mysql.connect();

  // Create products table
  await mysql.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_stock (stock)
    ) ENGINE=InnoDB
  `);

  // Create orders table
  await mysql.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB
  `);

  // Create order items table
  await mysql.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `);

  console.log('✅ MySQL tables initialized');
}

// Re-export for convenience
export { createMySQLConnectionFromEnv };
