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
import { sendOTP } from '@/lib/otp-service';

export async function POST(request: NextRequest) {
  try {
    const { fullname, email, phone, password, role } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Send OTP for email verification
    const otpResult = await sendOTP(email);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // Store user data temporarily in session storage or pass to OTP verification
    // For now, we'll store it in a temporary table or use the OTP record to store user data
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user data in a temporary way - we'll create the user after OTP verification
    // For now, we'll pass the data to the frontend to store temporarily
    const userData = {
      fullname,
      email,
      phone,
      password: hashedPassword,
      role: role || 'EMPLOYEE',
    };

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      userData: userData // This will be used by the frontend
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
