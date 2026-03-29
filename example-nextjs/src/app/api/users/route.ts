/**
 * Users API Route
 * GET /api/users - List users
 * POST /api/users - Create user
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { UserService } from '../../../services/UserService';

/**
 * GET /api/users
 * Query params: page, limit, active
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      const users = await UserService.findActive();
      return NextResponse.json({ users });
    }

    const { users, pagination } = await UserService.findAll(page, limit);
    
    return NextResponse.json({ users, pagination });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Body: { email, password, name: { first, last }, role? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validation
    if (!body.email || !body.password || !body.name?.first || !body.name?.last) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await UserService.findByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await UserService.create({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role || 'user',
    });

    return NextResponse.json(
      { user, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
