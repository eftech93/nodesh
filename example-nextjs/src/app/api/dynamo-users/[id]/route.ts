/**
 * DynamoDB User Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserDynamoRepo, initDynamoDB } from '@/lib/db-dynamodb';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initDynamoDB();
    initialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    
    const user = await UserDynamoRepo.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/dynamo-users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    
    const body = await request.json();
    const user = await UserDynamoRepo.update(params.id, body);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('PATCH /api/dynamo-users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables();
    
    await UserDynamoRepo.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/dynamo-users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
