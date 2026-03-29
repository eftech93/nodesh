/**
 * MySQL Database Connection
 * Uses the NodeSH MySQL adapter
 */

import { createMySQLConnectionFromEnv, MySQLConnection } from '@eftech93/nodesh';
import { Order, OrderItem, OrderWithItems, CreateOrderInput } from '@/models/Order';

// Export the raw mysql client for advanced queries
export let mysql: any;

// Connection instance
let connection: MySQLConnection | null = null;

export async function connectMySQL(): Promise<MySQLConnection> {
  if (!connection) {
    connection = await createMySQLConnectionFromEnv();
    mysql = (connection as any).client;
  }
  return connection;
}

// Initialize tables
export async function initMySQLTables(): Promise<void> {
  const conn = await connectMySQL();
  const client = (conn as any).client;
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
}

// Order Repository
export const OrderRepo = {
  async createWithItems(
    orderData: { userId: number; total: number },
    items: Array<{ productId: number; quantity: number; price: number }>
  ): Promise<OrderWithItems> {
    const conn = await connectMySQL();
    const client = (conn as any).client;
    
    // Insert order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
      [orderData.userId, orderData.total, 'pending']
    );
    
    const orderId = orderResult.insertId;
    
    // Insert items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }
    
    return {
      id: orderId,
      user_id: orderData.userId,
      total: orderData.total,
      status: 'pending',
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    } as OrderWithItems;
  },
  
  async getOrders(): Promise<Order[]> {
    const conn = await connectMySQL();
    const client = (conn as any).client;
    
    const result = await client.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    return result;
  },
  
  async getOrderById(id: number): Promise<OrderWithItems | null> {
    const conn = await connectMySQL();
    const client = (conn as any).client;
    
    const orders = await client.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (!orders[0]) return null;
    
    const items = await client.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );
    
    return { ...orders[0], items };
  },
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    const conn = await connectMySQL();
    const client = (conn as any).client;
    
    return await client.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  },
  
  async updateOrderStatus(id: number, status: string): Promise<boolean> {
    const conn = await connectMySQL();
    const client = (conn as any).client;
    
    const result = await client.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },
  
  async cancelOrder(id: number): Promise<boolean> {
    return this.updateOrderStatus(id, 'cancelled');
  },
};
