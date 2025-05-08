import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define query parameter validation schema
const querySchema = z.object({
  startdate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  enddate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
});

// API handler to fetch delivery orders
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const startdate = searchParams.get('startdate');
    const enddate = searchParams.get('enddate');
    const parsed = querySchema.parse({ startdate, enddate });

    // Ensure end_date is after start_date
    const startDate = new Date(parsed.startdate);
    const endDate = new Date(parsed.enddate);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'enddate must be after startdate' },
        { status: 400 }
      );
    }

    // Fetch delivery orders with optimized selection
    const orders = await prisma.delivery_orders.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        pickup_name: true,
        pickup_phone: true,
        pickup_address: true,
        dropoff_name: true,
        dropoff_phone: true,
        dropoff_address: true,
        instructions: true,
        distance: true,
        charge: true,
        created_at: true,
        pickup_cord: true,
        dropoff_cord: true,
        status: true,
        updated_at: true,
        customer_id: true,
        isBusiness: true,
        business_id: true,
        users: {
          select: {
            user_id: true,
            business_name: true, // Assuming users has business_name
            phone: true,
          },
        },
        customers: {
          select: {
            customer_id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform orders to remove redundant fields
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      pickup_name: order.pickup_name,
      pickup_phone: order.pickup_phone,
      pickup_address: order.pickup_address,
      dropoff_name: order.dropoff_name,
      dropoff_phone: order.dropoff_phone,
      dropoff_address: order.dropoff_address,
      instructions: order.instructions,
      distance: order.distance?.toNumber() ?? null, // Convert Decimal to number
      charge: order.charge?.toNumber() ?? null, // Convert Decimal to number
      created_at: order.created_at,
      pickup_cord: order.pickup_cord,
      dropoff_cord: order.dropoff_cord,
      status: order.status,
      updated_at: order.updated_at,
      customer_id: order.customer_id,
      isBusiness: order.isBusiness,
      business_id: order.business_id,
      users: order.users,
      customers: order.customers,
    }));

    // Return transformed orders
    return NextResponse.json({
      message: 'Delivery orders fetched successfully',
      orders: transformedOrders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Fetch delivery orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}