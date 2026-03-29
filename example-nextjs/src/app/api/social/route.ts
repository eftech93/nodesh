/**
 * Social Graph API Route - Neo4j
 * GET /api/social - Get social stats
 * POST /api/social - Create user
 */

import { NextRequest, NextResponse } from 'next/server';
import { SocialGraph, initNeo4j } from '@/lib/db-neo4j';
import { validateSocialUser } from '@/models/SocialUser';

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
    
    return NextResponse.json({ message: 'Social API ready' });
  } catch (error) {
    console.error('GET /api/social error:', error);
    return NextResponse.json({ error: 'Failed to fetch social data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    
    const body = await request.json();
    
    // Validate
    const errors = validateSocialUser(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    const user = await SocialGraph.createUser(body);
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/social error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
