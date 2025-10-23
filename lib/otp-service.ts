import nodemailer from 'nodemailer';
import { prisma } from '@/prisma/client';
import crypto from 'crypto';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP via email
export async function sendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Generate OTP
    const otpCode = generateOTP();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Delete any existing OTP for this email
    await prisma.otpVerification.deleteMany({
      where: { email }
    });
    
    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otp_code: otpCode,
        expires_at: expiresAt,
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'FIGA Care - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FIGA Care</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your trusted partner in care</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Email Verification</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for registering with FIGA Care! To complete your account setup, please use the verification code below:
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 5px; font-family: monospace;">
                ${otpCode}
              </div>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
              This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Best regards,<br>
                The FIGA Care Team
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP'
    };
  }
}

// Verify OTP
export async function verifyOTP(email: string, otpCode: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find the OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp_code: otpCode,
        is_used: false,
        expires_at: {
          gt: new Date() // Not expired
        }
      }
    });
    
    if (!otpRecord) {
      return {
        success: false,
        message: 'Invalid or expired OTP'
      };
    }
    
    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    });
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP'
    };
  }
}

// Clean up expired OTPs (can be called periodically)
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.otpVerification.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}
