import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    const normalized = String(email).toLowerCase().trim();

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

    // Hash the new password before storing so it matches signin comparisons
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: normalized },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
