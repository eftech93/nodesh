'use server';

/**
 * Order Server Actions
 * 
 * Demonstrates CRUD operations for orders
 */

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total?: number;
  createdAt?: Date;
}

// In-memory orders store
const orders: Map<string, Order> = new Map();

let orderIdCounter = 1000;

function generateOrderId(): string {
  return `ORD-${++orderIdCounter}`;
}

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  console.log('[Server Action] Fetching all orders...');
  await simulateDelay(100);
  return Array.from(orders.values());
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  console.log(`[Server Action] Fetching orders for user ${userId}...`);
  await simulateDelay(100);
  return Array.from(orders.values()).filter(order => order.userId === userId);
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  console.log(`[Server Action] Fetching order ${id}...`);
  await simulateDelay(50);
  return orders.get(id) || null;
}

/**
 * Create a new order
 */
export async function createOrder(data: Omit<Order, 'id' | 'total' | 'createdAt'>): Promise<Order> {
  console.log('[Server Action] Creating order:', data);
  await simulateDelay(200);
  
  const id = generateOrderId();
  const order: Order = {
    ...data,
    id,
    total: calculateTotal(data.items),
    createdAt: new Date(),
  };
  
  orders.set(id, order);
  return order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string, 
  status: Order['status']
): Promise<Order | null> {
  console.log(`[Server Action] Updating order ${id} status to ${status}...`);
  await simulateDelay(100);
  
  const order = orders.get(id);
  if (!order) return null;
  
  order.status = status;
  orders.set(id, order);
  
  return order;
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string): Promise<Order | null> {
  console.log(`[Server Action] Cancelling order ${id}...`);
  await simulateDelay(150);
  return updateOrderStatus(id, 'cancelled');
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}> {
  console.log('[Server Action] Calculating order statistics...');
  await simulateDelay(100);
  
  const allOrders = Array.from(orders.values());
  
  return {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    shipped: allOrders.filter(o => o.status === 'shipped').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    revenue: allOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };
}

// Helper function to simulate network delay
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
