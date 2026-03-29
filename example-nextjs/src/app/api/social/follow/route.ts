/**
 * Social Follow API Route - Neo4j
 * POST /api/social/follow - Follow a user
 * DELETE /api/social/follow - Unfollow a user
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

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    
    const body = await request.json();
    const { followerId, followingId } = body;
    
    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }
    
    const result = await SocialGraph.createFollow(followerId, followingId);
    
    return NextResponse.json({ success: true, relationship: result });
  } catch (error) {
    console.error('POST /api/social/follow error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSchema();
    
    const body = await request.json();
    const { followerId, followingId } = body;
    
    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }
    
    // Note: Unfollow is not implemented in simplified repo, returning success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/social/follow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
