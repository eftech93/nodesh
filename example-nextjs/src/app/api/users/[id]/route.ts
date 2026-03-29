/**
 * User API Route
 * GET /api/users/:id - Get user by ID
 * PATCH /api/users/:id - Update user
 * DELETE /api/users/:id - Delete user (deactivate)
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { UserService } from '../../../../services/UserService';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/users/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const user = await UserService.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error(`GET /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/:id
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, isActive, role } = body;

    const user = await UserService.update(params.id, {
      name,
      isActive,
      role,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user, message: 'User updated successfully' });
  } catch (error) {
    console.error(`PATCH /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/:id
 * Soft delete - deactivates the user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const user = await UserService.deactivate(params.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      user, 
      message: 'User deactivated successfully' 
    });
  } catch (error) {
    console.error(`DELETE /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
