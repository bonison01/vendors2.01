import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const productSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user_id format' }),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().nullable().optional(),
  price_inr: z.number().positive({ message: 'Price must be positive' }),
  media_urls: z.array(z.string().url({ message: 'Invalid URL format' })).optional().default([]),
  category: z.string().nullable().optional(),
  discount_rate: z.literal(0),
  discounted_price: z.number().positive({ message: 'Discounted price must be positive' }),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unit: z.string().nullable().optional(),
  unit_quantity: z.string().nullable().optional(),
}).strict();

const bulkAddSchema = z.array(productSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = bulkAddSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.errors[0].message },
        { status: 400 }
      );
    }

    const products = parsedBody.data;

    // Verify all products have the same user_id
    const userId = products[0]?.user_id;
    if (!userId || products.some((p) => p.user_id !== userId)) {
      return NextResponse.json(
        { error: 'All products must have the same user_id' },
        { status: 400 }
      );
    }

    // Create products in bulk
    const createdProducts = await prisma.$transaction(
      products.map((product) =>
        prisma.new_products.create({
          data: {
            user_id: product.user_id,
            name: product.name,
            description: product.description,
            price_inr: new Prisma.Decimal(product.price_inr),
            media_urls: product.media_urls,
            category: product.category,
            discount_rate: new Prisma.Decimal(product.discount_rate),
            discounted_price: new Prisma.Decimal(product.discounted_price),
            quantity: product.quantity,
            unit: product.unit,
            unit_quantity: product.unit_quantity,
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
        })
      )
    );

    return NextResponse.json({ products: createdProducts }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding bulk products:', error);
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