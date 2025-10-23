import { prisma } from '@/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fullname, email, phone, password, role } = await request.json();

    // Check if user already exists (double check)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create the user
    await prisma.user.create({
      data: {
        fullname,
        email,
        phone,
        password,
        role: role || 'EMPLOYEE',
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
