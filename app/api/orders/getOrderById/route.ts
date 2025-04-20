import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define query parameter validation schema
const querySchema = z.object({
  user_id: z.string().uuid(),
  startdate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  enddate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
});

// API handler to fetch orders by store_id
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const startdate = searchParams.get('startdate');
    const enddate = searchParams.get('enddate');
    const parsed = querySchema.parse({ user_id, startdate, enddate });

    // Fetch orders where store_ids contains user_id, is_ordered = 1, and within date range
    const orders = await prisma.order_rec.findMany({
      where: {
        is_ordered: 1,
        store_ids: {
          has: parsed.user_id,
        },
        created_at: {
          gte: new Date(parsed.startdate),
          lte: new Date(parsed.enddate),
        },
      },
      include: {
        order_item: {
          where: {
            new_products: {
              user_id: parsed.user_id,
            },
          },
          include: {
            new_products: {
              select: {
                id: true,
                name: true,
                price_inr: true,
                discounted_price: true,
                user_id: true,
                user_name: true,
              },
            },
          },
        },
        customers: {
          select: {
            customer_id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Return orders
    return NextResponse.json({
      message: 'Orders fetched successfully',
      orders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Fetch orders by store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}