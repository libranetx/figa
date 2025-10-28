import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/otp-service';
import { prisma } from '@/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalized = String(email).toLowerCase().trim();

    // Ensure user exists before sending a password-reset OTP
    const user = await prisma.user.findUnique({ where: { email: normalized } });

    if (!user) {
      // For privacy you might return a generic success message, but here we return 404
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

  const result = await sendOTP(normalized, 'reset');

    if (!result.success) {
      const status = result.message.includes('configured') ? 500 : 400;
      return NextResponse.json({ error: result.message }, { status });
    }

    return NextResponse.json({ success: true, message: 'OTP sent. Check your email.' });
  } catch (error: any) {
    console.error('Error in forgot-password API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
