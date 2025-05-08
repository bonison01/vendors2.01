import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define body validation schema for PUT
const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  business_name: z.string().nullable().optional(),
  business_address: z.string().nullable().optional(),
  business_type: z.string().nullable().optional(),
  product_service: z.string().nullable().optional(),
  business_experience: z.string().nullable().optional(),
  business_description: z.string().nullable().optional(),
  is_registered: z.boolean().nullable().optional(),
  categories: z.array(z.string()).optional(),
  photo: z.string().nullable().optional(), // Added photo field
});

// Define body validation schema for POST (sign-up)
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

// PUT: Update user details
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const parsedQuery = z.object({ user_id: z.string().uuid() }).parse({ user_id });

    // Parse and validate request body
    const body = await request.json();
    const parsedBody = updateSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { user_id: parsedQuery.user_id },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update only provided fields
    const updatedUser = await prisma.users.update({
      where: { user_id: parsedQuery.user_id },
      data: {
        name: parsedBody.name !== undefined ? parsedBody.name : existingUser.name,
        email: parsedBody.email !== undefined ? parsedBody.email : existingUser.email,
        password: parsedBody.password !== undefined ? parsedBody.password : existingUser.password,
        address: parsedBody.address !== undefined ? parsedBody.address : existingUser.address,
        phone: parsedBody.phone !== undefined ? parsedBody.phone : existingUser.phone,
        whatsapp: parsedBody.whatsapp !== undefined ? parsedBody.whatsapp : existingUser.whatsapp,
        business_name:
          parsedBody.business_name !== undefined ? parsedBody.business_name : existingUser.business_name,
        business_address:
          parsedBody.business_address !== undefined
            ? parsedBody.business_address
            : existingUser.business_address,
        business_type:
          parsedBody.business_type !== undefined ? parsedBody.business_type : existingUser.business_type,
        product_service:
          parsedBody.product_service !== undefined
            ? parsedBody.product_service
            : existingUser.product_service,
        business_experience:
          parsedBody.business_experience !== undefined
            ? parsedBody.business_experience
            : existingUser.business_experience,
        business_description:
          parsedBody.business_description !== undefined
            ? parsedBody.business_description
            : existingUser.business_description,
        is_registered:
          parsedBody.is_registered !== undefined ? parsedBody.is_registered : existingUser.is_registered,
        categories: parsedBody.categories !== undefined ? parsedBody.categories : existingUser.categories,
        photo: parsedBody.photo !== undefined ? parsedBody.photo : existingUser.photo, // Added photo update
      },
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

    return NextResponse.json({
      message: 'User details updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create new user (sign-up)
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = signupSchema.parse(body);

    // Find the highest vendor_id by sorting explicitly in descending order
    const lastUser = await prisma.users.findFirst({
      where: { vendor_id: { not: null } },
      orderBy: { vendor_id: 'desc' },
      select: { vendor_id: true },
    });
    const nextVendorId = lastUser && lastUser.vendor_id !== null ? lastUser.vendor_id + 1 : 1;

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
        phone: parsed.phone,
        address: parsed.address,
        is_registered: false,
        is_business_owner: false,
        vendor_id: nextVendorId,
      },
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

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}