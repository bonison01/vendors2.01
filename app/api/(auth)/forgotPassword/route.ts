// app/api/(auth)/forgotPassword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST = async (req: NextRequest) => {
    try {
        const { email, phone, vendor_id, newPassword } = await req.json();

        // 1. Validate incoming data
        if (!email || !phone || !vendor_id || !newPassword) {
            return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
        }

        // 2. Parse vendor_id to an integer
        const parsedVendorId = parseInt(vendor_id, 10);
        if (isNaN(parsedVendorId)) {
            return NextResponse.json({ success: false, message: 'Invalid vendor ID format' }, { status: 400 });
        }

        // 3. Find the user in the 'users' table
        const user = await prisma.users.findFirst({
            where: {
                email: email,
                phone: phone,
                vendor_id: parsedVendorId, // Use the parsed integer here
            },
        });

        // 4. Handle case where user is not found
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found. Check your email, phone, and vendor ID.' }, { status: 404 });
        }

        // 5. Update the password
        await prisma.users.update({
            where: {
                user_id: user.user_id,
            },
            data: {
                password: newPassword,
            },
        });

        // 6. Return success response
        return NextResponse.json({ success: true, message: 'Password reset successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Password Reset Error:', error);
        return NextResponse.json({ success: false, message: 'An error occurred. Please try again.' }, { status: 500 });
    }
};