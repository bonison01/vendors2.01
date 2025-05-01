import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define input validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

// Login API handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        user_id: true,
        name: true,
        email: true,
        password: true,
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
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password (plain text comparison)
    if (password !== user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Determine role
    const role =
      email === 'justmatengservices@gmail.com' && password === 'Mateng@011'
        ? 'Admin'
        : 'Vendor';

    // Remove password from response
    const { password: _, ...userData } = user;

    // Return user data with role
    return NextResponse.json({
      message: 'Login successful',
      user: userData,
      role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}