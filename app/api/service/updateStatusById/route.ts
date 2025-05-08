import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define validation schema for request body
const bodySchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Out for Delivery', 'Delivered', 'Cancelled'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

// Define validation schema for query params
const querySchema = z.object({
  id: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  }, { message: 'Invalid order ID' }),
});

// API handler to update delivery order status
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const parsedQuery = querySchema.parse({ id });
    const orderId = Number(parsedQuery.id);

    // Parse and validate request body
    const body = await request.json();
    const parsedBody = bodySchema.parse(body);

    // Update delivery order
    await prisma.delivery_orders.update({
      where: {
        id: orderId,
      },
      data: {
        status: parsedBody.status,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Delivery order status updated successfully',
    }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Order not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    console.error('Update delivery order error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}