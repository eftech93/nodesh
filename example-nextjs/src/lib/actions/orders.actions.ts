'use server';

/**
 * Order Server Actions - MySQL
 */

import { mysql, OrderRepo, initMySQLTables } from '@/lib/db-mysql';
import { validateOrder, calculateOrderTotal } from '@/models/Order';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initMySQLTables();
    initialized = true;
  }
}

export async function getOrders() {
  'use server';
  await ensureTables();
  return OrderRepo.getOrders();
}

export async function getOrderById(id: number) {
  'use server';
  await ensureTables();
  return OrderRepo.getOrderById(id);
}

export async function getOrdersByUser(userId: number) {
  'use server';
  await ensureTables();
  return OrderRepo.getOrdersByUser(userId);
}

export async function createOrder(data: {
  userId: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
}) {
  'use server';
  await ensureTables();
  
  const errors = validateOrder(data);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  const total = calculateOrderTotal(data.items);
  return OrderRepo.createWithItems({ userId: data.userId, total }, data.items);
}

export async function updateOrderStatus(
  id: number,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
  'use server';
  await ensureTables();
  return OrderRepo.updateOrderStatus(id, status);
}

export async function cancelOrder(id: number) {
  'use server';
  await ensureTables();
  return OrderRepo.cancelOrder(id);
}

export async function getOrderStats() {
  'use server';
  await ensureTables();
  const result = await mysql.query(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total) as total_amount
    FROM orders
    GROUP BY status
  `);
  return result;
}

export async function getRecentOrders(limit = 10) {
  'use server';
  await ensureTables();
  const result = await mysql.query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return result;
}

export async function getOrderStatsByDate() {
  'use server';
  await ensureTables();
  const result = await mysql.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(total) as total_revenue
    FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);
  return result;
}
