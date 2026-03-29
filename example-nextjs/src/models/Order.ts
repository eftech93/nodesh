/**
 * Order Model for MySQL
 * Used with the OrderRepo in lib/db-mysql.ts
 */

export interface Order {
  id?: number;
  user_id: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  userId: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export function calculateOrderTotal(items: Array<{ quantity: number; price: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

export function validateOrder(data: Partial<CreateOrderInput>): string[] {
  const errors: string[] = [];
  
  if (!data.userId || data.userId <= 0) {
    errors.push('User ID is required');
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('Order must have at least one item');
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId || item.productId <= 0) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Price must be positive`);
      }
    });
  }
  
  return errors;
}
