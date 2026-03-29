/**
 * Social Users API Route - Neo4j
 * GET /api/social/users - List users
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialGraph, initNeo4j } from '@/lib/db-neo4j';

let initialized = false;
async function ensureSchema() {
  if (!initialized) {
    await initNeo4j();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const user = await SocialGraph.getUser(id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ user });
    }
    
    return NextResponse.json({ message: 'Use POST /api/social to create users' });
  } catch (error) {
    console.error('GET /api/social/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
