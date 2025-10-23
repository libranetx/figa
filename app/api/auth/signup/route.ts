// import { prisma } from '@/prisma/client'; 
// import bcrypt from 'bcryptjs';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//   try {
//     const { name, email, password } = await request.json();

//     const existingUser = await prisma.user.findUnique({
//       where: { email: email },
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'Email already exists' },
//         { status: 400 }
//       );
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: 'user',
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-service';

export async function POST(request: NextRequest) {
  try {
    const { fullname, email, phone, password, role, otp } = await request.json();

    // Validate required fields
    if (!fullname || !email || !password || !otp) {
      return NextResponse.json(
        { error: 'All fields including OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP first
    const isOTPValid = await verifyOTP(email, otp);
    if (!isOTPValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        fullname,
        email,
        phone,
        password: hashedPassword,
        role: role || 'EMPLOYEE', 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
