/**
 * Orders API Route - MySQL
 * GET /api/orders - List orders
 * POST /api/orders - Create order
 */

import { NextRequest, NextResponse } from 'next/server';
import { mysql, OrderRepo, initMySQLTables } from '@/lib/db-mysql';
import { validateOrder, calculateOrderTotal } from '@/models/Order';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initMySQLTables();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let orders;
    if (userId) {
      orders = await OrderRepo.getOrdersByUser(parseInt(userId));
    } else if (status) {
      const result = await mysql.query(
        'SELECT * FROM orders WHERE status = ? LIMIT ?',
        [status, limit]
      );
      orders = result;
    } else {
      orders = await OrderRepo.getOrders();
    }
    
    return NextResponse.json({ orders, count: orders.length });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    
    const body = await request.json();
    
    // Validate
    const errors = validateOrder(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    // Calculate total from items
    const total = calculateOrderTotal(body.items);
    
    const order = await OrderRepo.createWithItems(
      { userId: body.userId, total },
      body.items
    );
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
