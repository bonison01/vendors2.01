import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const {
      vendor_id,
      business_name,
      business_address,
      primary_contact,
      opening_hours,
      product_service,
      unique_product_service,
      product_photo_video, // This is the field for the product photo URL
      experience_in_field,
      pickup_location_1,
      pickup_location_2,
      pickup_location_3,
      google_map_link,
      account_holder_name,
      account_number,
      ifsc,
      bank_name,
      upi_qr, // This is the field for the UPI QR code URL
      account_type,
    } = await request.json();

    if (!vendor_id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Step 1: Find the user by vendor_id
    const user = await prisma.users.findFirst({
      where: { vendor_id: parseInt(vendor_id, 10) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    }

    // Step 2: Update using unique key (user_id)
    const updatedUser = await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        business_name,
        business_address,
        primary_contact,
        opening_hours,
        product_service,
        unique_product_service,
        product_photo_video,
        experience_in_field,
        pickup_location_1,
        pickup_location_2,
        pickup_location_3,
        google_map_link,
        account_holder_name,
        account_number,
        ifsc,
        bank_name,
        upi_qr,
        account_type,
      },
    });

    return NextResponse.json(
      {
        message: 'Vendor details updated successfully',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error:', error);

    if (error instanceof Error) {
        // Check for specific Prisma errors
        if ('code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
        }
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}