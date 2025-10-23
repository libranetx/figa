import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/otp-service';
import { prisma } from '@/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Send OTP
    const result = await sendOTP(email);

    if (!result.success) {
      // Return 400 for client errors, 500 for server errors
      const status = result.message.includes('configured') ? 500 : 400;
      return NextResponse.json(
        { error: result.message },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    console.error('Error in send-otp API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}