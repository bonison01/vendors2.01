import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define query parameter validation schema
const querySchema = z.object({
  startdate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  enddate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
});

// API handler to fetch all orders
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const startdate = searchParams.get('startdate');
    const enddate = searchParams.get('enddate');
    const parsed = querySchema.parse({ startdate, enddate });

    // Fetch orders with optimized selection
    const orders = await prisma.order_rec.findMany({
      where: {
        is_ordered: {
          not: 0,
        },
        created_at: {
          gte: new Date(parsed.startdate),
          lte: new Date(parsed.enddate),
        },
      },
      select: {
        id: true,
        order_id: true,
        buyer_name: true,
        buyer_address: true,
        buyer_phone: true,
        email: true,
        created_at: true,
        status: true,
        total_price: true,
        total_calculated_price: true,
        item_count: true,
        is_ordered: true,
        landmark: true,
        buyer_id: true,
        order_at: true,
        customers: {
          select: {
            customer_id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        order_item: {
          select: {
            id: true,
            order_id: true,
            product_id: true,
            quantity: true,
            added_at: true,
            new_products: {
              select: {
                id: true,
                name: true,
                price_inr: true,
                discounted_price: true,
                user_id: true,
                user_name: true,
                users: {
                  select: {
                    user_id: true,
                    business_name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform orders to group items by store and remove duplicates
    const transformedOrders = orders.map((order) => {
      // Group order items by store (user_id)
      const storeMap: {
        [key: string]: {
          store_id: string;
          business_name: string;
          items: any[];
        };
      } = {};

      order.order_item.forEach((item) => {
        const product = item.new_products;
        const storeId = product.user_id ?? 'Unknown Store';
        const businessName = product.users?.business_name ?? 'Unknown Store';

        if (!storeMap[storeId]) {
          storeMap[storeId] = {
            store_id: storeId,
            business_name: businessName,
            items: [],
          };
        }

        storeMap[storeId].items.push({
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          product_name: product.name,
          price_inr: product.price_inr.toNumber() ?? 0, // Convert Decimal to number
          discounted_price: product.discounted_price?.toNumber() ?? 0, // Handle null
          user_name: product.user_name,
        });
      });

      // Convert storeMap to array
      const stores = Object.values(storeMap);

      // Return only necessary fields, excluding redundant ones
      return {
        id: order.id,
        order_id: order.order_id,
        buyer_name: order.buyer_name,
        buyer_address: order.buyer_address,
        buyer_phone: order.buyer_phone,
        email: order.email,
        created_at: order.created_at,
        status: order.status,
        total_price: order.total_price,
        total_calculated_price: order.total_calculated_price,
        item_count: order.item_count,
        is_ordered: order.is_ordered,
        landmark: order.landmark,
        buyer_id: order.buyer_id,
        order_at: order.order_at,
        customers: order.customers,
        stores,
      };
    });

    // Return transformed orders
    return NextResponse.json({
      message: 'Orders fetched successfully',
      orders: transformedOrders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
