/**
 * DynamoDB Users API Route
 * GET /api/dynamo-users - List users
 * POST /api/dynamo-users - Create user
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserDynamoRepo, initDynamoDB } from '@/lib/db-dynamodb';
import { validateDynamoUser, createUserItem } from '@/models/DynamoUser';

let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initDynamoDB();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let users;
    if (id) {
      const user = await UserDynamoRepo.findById(id);
      users = user ? [user] : [];
    } else if (email) {
      const user = await UserDynamoRepo.findByEmail(email);
      users = user ? [user] : [];
    } else {
      users = await UserDynamoRepo.list(limit);
    }
    
    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error('GET /api/dynamo-users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    
    const body = await request.json();
    
    // Create user item
    const userData = createUserItem(body);
    
    // Validate
    const errors = validateDynamoUser(userData);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    const user = await UserDynamoRepo.create(body);
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/dynamo-users error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
