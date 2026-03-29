/**
 * Products API Route - PostgreSQL
 * GET /api/products - List products
 * POST /api/products - Create product
 */

import { NextRequest, NextResponse } from 'next/server';
import { pg, ProductRepo, initPostgresTables } from '@/lib/db-postgres';
import { validateProduct } from '@/models/Product';

// Ensure tables exist
let initialized = false;
async function ensureTables() {
  if (!initialized) {
    await initPostgresTables();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let products;
    if (search) {
      products = await ProductRepo.search(search);
    } else if (category) {
      // Query by category
      const result = await pg.query(
        'SELECT * FROM products WHERE category = $1 LIMIT $2',
        [category, limit]
      );
      products = result.rows;
    } else {
      products = await ProductRepo.findAll(limit);
    }
    
    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    
    const body = await request.json();
    
    // Validate
    const errors = validateProduct(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    const product = await ProductRepo.create(body);
    
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
