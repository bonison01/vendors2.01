import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define query parameter validation schema
const querySchema = z.object({
  user_id: z.string().uuid(),
});

// API handler to fetch user details
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const parsed = querySchema.parse({ user_id });

    // Find user by user_id
    const user = await prisma.users.findUnique({
      where: { user_id: parsed.user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        is_business_owner: true,
        business_name: true,
        business_address: true,
        business_type: true,
        product_service: true,
        business_experience: true,
        business_description: true,
        is_registered: true,
        isbusinessowner: true,
        photo: true,
        categories: true,
        whatsapp: true,
        rating: true,
        vendor_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      message: 'User details fetched successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Fetch user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}