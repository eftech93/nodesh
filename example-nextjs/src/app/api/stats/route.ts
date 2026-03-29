/**
 * Stats API Route
 * GET /api/stats - Get application statistics
 */
import { NextResponse } from 'next/server';
import { connectDB, getDBStats } from '../../../../lib/db';
import { UserService } from '../../../services/UserService';

/**
 * GET /api/stats
 */
export async function GET() {
  try {
    await connectDB();

    const [userStats, dbStats] = await Promise.all([
      UserService.getStats(),
      getDBStats(),
    ]);

    return NextResponse.json({
      users: userStats,
      database: dbStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
