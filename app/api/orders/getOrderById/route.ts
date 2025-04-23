import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Define query parameter validation schema
const querySchema = z.object({
  user_id: z.string().uuid(),
  startdate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  enddate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
});

// API handler to fetch orders by store_id (user_id)
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const startdate = searchParams.get('startdate');
    const enddate = searchParams.get('enddate');
    const parsed = querySchema.parse({ user_id, startdate, enddate });

    // Fetch orders with optimized selection
    const orders = await prisma.order_rec.findMany({
      where: {
        is_ordered: 1,
        store_ids: {
          has: parsed.user_id,
        },
        created_at: {
          gte: new Date(parsed.startdate),
          lte: new Date(parsed.enddate),
        },
      },
      distinct: ['id'], // Ensure unique orders
      select: {
        id: true,
        order_id: true,
        buyer_name: true,
        buyer_address: true,
        buyer_phone: true,
        email: true,
        created_at: true,
        status: true,
        total_calculated_price: true,
        item_count: true,
        is_ordered: true,
        landmark: true,
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
          where: {
            new_products: {
              user_id: parsed.user_id,
            },
          },
          select: {
            order_id: true,
            product_id: true,
            quantity: true,
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

    // Transform orders to group items by store and match frontend schema
    const transformedOrders = orders.map((order) => {
      // Group order items by store (user_id)
      const storeMap: {
        [key: string]: {
          store_id: string;
          business_name: string;
          phone: string | null;
          items: {
            order_id: string;
            product_id: string;
            quantity: number;
            product_name: string;
            price_inr: number;
            discounted_price: number;
            user_name: string;
          }[];
        };
      } = {};

      order.order_item.forEach((item) => {
        const product = item.new_products;
        const store = product.users;
        const storeId = product.user_id ?? 'unknown';
        const businessName = store?.business_name ?? 'Unknown Store';

        if (!storeMap[storeId]) {
          storeMap[storeId] = {
            store_id: storeId,
            business_name: businessName,
            phone: store?.phone ?? null,
            items: [],
          };
        }

        storeMap[storeId].items.push({
          order_id: item.order_id ?? 'Unknow',
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          product_name: product.name,
          price_inr: product.price_inr?.toNumber() ?? 0,
          discounted_price: product.discounted_price?.toNumber() ?? 0,
          user_name: product.user_name ?? 'Unknown',
        });
      });

      // Convert storeMap to array
      const stores = Object.values(storeMap);

      // Return transformed order matching frontend schema
      return {
        id: order.id,
        order_id: order.order_id,
        order_at: order.created_at ? order.created_at.toISOString() : new Date().toISOString(),
        status: order.status ?? 'unknown',
        total_calculated_price: order.total_calculated_price?.toString() ?? '0',
        item_count: order.item_count?.toString() ?? '0',
        buyer_name: order.buyer_name,
        buyer_address: order.buyer_address,
        buyer_phone: order.buyer_phone,
        email: order.email,
        landmark: order.landmark,
        customers: order.customers ?? {
          customer_id: '',
          name: order.buyer_name,
          email: order.email ?? '',
          phone: order.buyer_phone ?? '',
        },
        stores,
        is_ordered: order.is_ordered ? 1 : 0,
      };
    });

    // Remove duplicates by order_id
    const uniqueOrders = Array.from(
      new Map(transformedOrders.map((order) => [order.order_id, order])).values()
    );

    // Return transformed orders
    return NextResponse.json({
      message: 'Orders fetched successfully',
      orders: uniqueOrders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Fetch orders by store error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

