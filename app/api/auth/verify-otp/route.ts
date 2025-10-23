import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-service';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    console.log('OTP verification request for:', email);

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOTP(email, otp);

    if (!result.success) {
      console.log('OTP verification failed:', result.message);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    console.log('OTP verification successful for:', email);
    
    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in verify-otp API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}