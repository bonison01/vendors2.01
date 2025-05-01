import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const querySchema = z.object({
  vendor_id: z.string().transform((val) => parseInt(val)).refine((val) => !isNaN(val) && val > 0, {
    message: 'Vendor ID must be a valid positive integer',
  }),
}).strict();

export async function GET(request: NextRequest) {
  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      vendor_id: searchParams.get('vendor_id') || '',
    };

    const parsedQuery = querySchema.safeParse(query);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.errors[0].message },
        { status: 400 }
      );
    }

    const { vendor_id } = parsedQuery.data;

    // Fetch delivery records by vendor_id
    const deliveryRecords = await prisma.delivery_rec.findMany({
      where: {
        vendor_id: vendor_id,
      },
      select: {
        date: true,
        name: true,
        address: true,
        mobile: true,
        vendor: true,
        team: true,
        mode: true,
        pb: true,
        dc: true,
        pb_amt: true,
        dc_amt: true,
        tsb: true,
        cid: true,
        status: true,
        note: true,
        order_id: true,
        vendor_id: true,
        delivery_id: true,
      },
    });

    if (!deliveryRecords || deliveryRecords.length === 0) {
      return NextResponse.json(
        { message: 'No delivery records found for this vendor_id' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deliveryRecords }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching delivery records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}