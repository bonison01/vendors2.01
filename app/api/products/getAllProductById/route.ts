import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const querySchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user_id format' }),
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const parsedQuery = querySchema.safeParse({ user_id: userId });
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.errors[0].message },
        { status: 400 }
      );
    }

    // Query products by user_id
    const products = await prisma.new_products.findMany({
      where: {
        user_id: parsedQuery.data.user_id,
      },
      select: {
        id: true,
        user_id: true,
        name: true,
        description: true,
        price_inr: true,
        media_urls: true,
        category: true,
        user_name: true,
        discount_rate: true,
        discounted_price: true,
        quantity: true,
        unit: true,
        unit_quantity: true,
        updated_at: true,
      },
    });

    // Return products
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}