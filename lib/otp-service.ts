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

// Fallback for development/testing when email is not configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS;
};

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
export async function sendOTP(email: string, otp: string): Promise<boolean> {
  try {
    // Check if email configuration is available
    if (!isEmailConfigured()) {
      console.log('Email not configured. Using development mode - OTP will be logged to console.');
      console.log(`📧 OTP for ${email}: ${otp}`);
      console.log('To enable email sending, set EMAIL_USER and EMAIL_PASS environment variables.');
      return true; // Return true for development mode
    }

    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');

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

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

// Store OTP in database
export async function storeOTP(email: string, otp: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error storing OTP in database:', error);
    // In development mode, we can continue without database storage
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode without database storage');
      return;
    }
    throw error;
  }
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
    // In development mode, allow any OTP if database is not available
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Accepting OTP without database verification');
      return true;
    }
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
