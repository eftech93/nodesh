/**
 * Order Detail API Route - MySQL
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderRepo, initMySQLTables } from '@/lib/db-mysql';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initMySQLTables();
    initialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const order = await OrderRepo.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const order = await OrderRepo.updateOrderStatus(id, body.status);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    // Cancel order instead of delete
    const order = await OrderRepo.cancelOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
