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
        password: true,
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



// import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import { z } from 'zod';

// const prisma = new PrismaClient();

// // Define query parameter validation schema for GET
// const querySchema = z.object({
//   user_id: z.string().uuid(),
// });

// // Define body validation schema for PUT
// const updateSchema = z.object({
//   user_id: z.string().uuid(),
//   name: z.string().nullable().optional(),
//   email: z.string().email().nullable().optional(),
//   address: z.string().nullable().optional(),
//   phone: z.string().nullable().optional(),
//   whatsapp: z.string().nullable().optional(),
//   business_name: z.string().nullable().optional(),
//   business_address: z.string().nullable().optional(),
//   business_type: z.string().nullable().optional(),
//   product_service: z.string().nullable().optional(),
//   business_experience: z.string().nullable().optional(),
//   business_description: z.string().nullable().optional(),
//   is_registered: z.boolean().nullable().optional(),
//   categories: z.array(z.string()).nullable().optional(),
// });

// // API handler
// export async function GET(request: NextRequest) {
//   try {
//     // Parse and validate query parameters
//     const { searchParams } = new URL(request.url);
//     const user_id = searchParams.get('user_id');
//     const parsed = querySchema.parse({ user_id });

//     // Find user by user_id
//     const user = await prisma.users.findUnique({
//       where: { user_id: parsed.user_id },
//       select: {
//         user_id: true,
//         name: true,
//         email: true,
//         address: true,
//         phone: true,
//         is_business_owner: true,
//         business_name: true,
//         business_address: true,
//         business_type: true,
//         product_service: true,
//         business_experience: true,
//         business_description: true,
//         is_registered: true,
//         isbusinessowner: true,
//         photo: true,
//         categories: true,
//         whatsapp: true,
//         rating: true,
//         vendor_id: true,
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     // Return user data
//     return NextResponse.json({
//       message: 'User details fetched successfully',
//       user,
//     });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid input', details: error.errors },
//         { status: 400 }
//       );
//     }
//     console.error('Fetch user error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// export async function PUT(request: NextRequest) {
//   try {
//     // Parse and validate request body
//     const body = await request.json();
//     const parsed = updateSchema.parse(body);

//     // Check if user exists
//     const existingUser = await prisma.users.findUnique({
//       where: { user_id: parsed.user_id },
//     });
//     if (!existingUser) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     // Update only provided fields
//     const updatedUser = await prisma.users.update({
//       where: { user_id: parsed.user_id },
//       data: {
//         name: parsed.name !== undefined ? parsed.name : existingUser.name,
//         email: parsed.email !== undefined ? parsed.email : existingUser.email,
//         address: parsed.address !== undefined ? parsed.address : existingUser.address,
//         phone: parsed.phone !== undefined ? parsed.phone : existingUser.phone,
//         whatsapp: parsed.whatsapp !== undefined ? parsed.whatsapp : existingUser.whatsapp,
//         business_name:
//           parsed.business_name !== undefined ? parsed.business_name : existingUser.business_name,
//         business_address:
//           parsed.business_address !== undefined
//             ? parsed.business_address
//             : existingUser.business_address,
//         business_type:
//           parsed.business_type !== undefined ? parsed.business_type : existingUser.business_type,
//         product_service:
//           parsed.product_service !== undefined
//             ? parsed.product_service
//             : existingUser.product_service,
//         business_experience:
//           parsed.business_experience !== undefined
//             ? parsed.business_experience
//             : existingUser.business_experience,
//         business_description:
//           parsed.business_description !== undefined
//             ? parsed.business_description
//             : existingUser.business_description,
//         is_registered:
//           parsed.is_registered !== undefined ? parsed.is_registered : existingUser.is_registered,
//         categories: parsed.categories !== undefined ? parsed.categories : existingUser.categories,
//       },
//       select: {
//         user_id: true,
//         name: true,
//         email: true,
//         address: true,
//         phone: true,
//         is_business_owner: true,
//         business_name: true,
//         business_address: true,
//         business_type: true,
//         product_service: true,
//         business_experience: true,
//         business_description: true,
//         is_registered: true,
//         isbusinessowner: true,
//         photo: true,
//         categories: true,
//         whatsapp: true,
//         rating: true,
//         vendor_id: true,
//       },
//     });

//     return NextResponse.json({
//       message: 'User details updated successfully',
//       user: updatedUser,
//     });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid input', details: error.errors },
//         { status: 400 }
//       );
//     }
//     console.error('Update user error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   } finally {
//     await prisma.$disconnect();
//   }
// }