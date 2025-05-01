import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch all users
    const users = await prisma.users.findMany({
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

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: 'No users found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}