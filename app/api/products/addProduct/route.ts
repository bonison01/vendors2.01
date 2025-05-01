import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const addSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user_id format' }),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().nullable().optional(),
  price_inr: z.number().positive({ message: 'Price must be positive' }),
  media_urls: z.array(z.string().url({ message: 'Invalid URL format' })).optional().default([]),
  category: z.string().nullable().optional(),
  discount_rate: z.literal(0), // Force discount_rate to be 0
  discounted_price: z.number().positive({ message: 'Discounted price must be positive' }),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unit: z.string().nullable().optional(),
  unit_quantity: z.string().nullable().optional(),
}).strict(); // Enforce no extra fields like id

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = addSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      user_id,
      name,
      description,
      price_inr,
      media_urls,
      category,
      discount_rate,
      discounted_price,
      quantity,
      unit,
      unit_quantity,
    } = parsedBody.data;

    // Create new product
    const newProduct = await prisma.new_products.create({
      data: {
        user_id,
        name,
        description,
        price_inr: new Prisma.Decimal(price_inr),
        media_urls,
        category,
        discount_rate: new Prisma.Decimal(discount_rate), // Always 0
        discounted_price: new Prisma.Decimal(discounted_price), // User-provided
        quantity,
        unit,
        unit_quantity,
        updated_at: new Date(),
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

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding product:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this ID already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}