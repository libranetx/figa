import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test if OtpVerification table exists
    const otpCount = await prisma.otpVerification.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      otpTableExists: true,
      otpCount,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      otpTableExists: false,
    }, { status: 500 });
  }
}
