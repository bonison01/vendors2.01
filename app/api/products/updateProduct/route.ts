import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const updateSchema = z.object({
  id: z.number().int().positive({ message: 'Invalid product ID' }),
  user_id: z.string().uuid({ message: 'Invalid user_id format' }),
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  description: z.string().nullable().optional(),
  price_inr: z.number().positive({ message: 'Price must be positive' }).optional(),
  media_urls: z.array(z.string().url({ message: 'Invalid URL format' })).optional(),
  category: z.string().nullable().optional(),
  discount_rate: z.number().min(0).max(100).optional(),
  quantity: z.number().int().nonnegative().nullable().optional(),
  unit: z.string().nullable().optional(),
  unit_quantity: z.string().nullable().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = updateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      id,
      user_id,
      name,
      description,
      price_inr,
      media_urls,
      category,
      discount_rate,
      quantity,
      unit,
      unit_quantity,
    } = parsedBody.data;

    // Verify product exists and belongs to the user
    const existingProduct = await prisma.new_products.findFirst({
      where: {
        id,
        user_id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate discounted price if price_inr or discount_rate is provided
    let discounted_price: Prisma.Decimal | undefined;
    if (price_inr !== undefined || discount_rate !== undefined) {
      const finalPrice = price_inr !== undefined ? price_inr : Number(existingProduct.price_inr);
      const finalDiscount = discount_rate !== undefined ? discount_rate : Number(existingProduct.discount_rate);
      discounted_price = new Prisma.Decimal(finalPrice * (1 - finalDiscount / 100));
    }

    // Update product
    const updatedProduct = await prisma.new_products.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price_inr: price_inr !== undefined ? new Prisma.Decimal(price_inr) : existingProduct.price_inr,
        media_urls: media_urls !== undefined ? media_urls : existingProduct.media_urls,
        category: category !== undefined ? category : existingProduct.category,
        discount_rate: discount_rate !== undefined ? discount_rate : existingProduct.discount_rate,
        discounted_price: discounted_price !== undefined ? discounted_price : existingProduct.discounted_price,
        quantity: quantity !== undefined ? quantity : existingProduct.quantity,
        unit: unit !== undefined ? unit : existingProduct.unit,
        unit_quantity: unit_quantity !== undefined ? unit_quantity : existingProduct.unit_quantity,
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

    return NextResponse.json({ product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}