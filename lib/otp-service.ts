import nodemailer from 'nodemailer';
import { prisma } from '@/prisma/client';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
export async function sendOTP(email: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'FIGA Care - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">FIGA Care</h1>
            <p style="color: #64748b; margin: 5px 0;">Your trusted partner in care</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Email Verification</h2>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for registering with FIGA Care! To complete your registration, 
              please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
              This code will expire in 10 minutes. If you didn't request this verification, 
              please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
            <p>© 2024 FIGA Care. All rights reserved.</p>
            <p>Compassion meets reliability. Building trusted care connections, one match at a time.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

// Store OTP in database
export async function storeOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Delete any existing OTPs for this email
  await prisma.otpVerification.deleteMany({
    where: { email },
  });

  // Store the new OTP
  await prisma.otpVerification.create({
    data: {
      email,
      otp,
      expiresAt,
    },
  });
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  try {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        isUsed: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

// Clean up expired OTPs
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}
