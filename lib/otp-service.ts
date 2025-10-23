import nodemailer from 'nodemailer';
import { prisma } from '@/prisma/client';
import crypto from 'crypto';
import validator from 'validator';

// Validate environment variables on startup
function validateEnvironment() {
  const required = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    // Don't throw during module import/build (Next.js may build without runtime secrets).
    // Log a warning and return false so callers can decide how to proceed at runtime.
    console.warn(`Missing environment variables for email: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

// Check whether email is configured. We intentionally do NOT throw here because
// Next.js builds may run in environments where runtime secrets are not available.
const EMAIL_CONFIGURED = validateEnvironment();

// Email transporter (only created when configuration is present)
let transporter: nodemailer.Transporter | null = null;
if (EMAIL_CONFIGURED) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
  });

  // Test email connection
  transporter.verify((error) => {
    if (error) {
      console.error('Email configuration error:', error);
    } else {
      console.log('Email server is ready');
    }
  });
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  // crypto.randomInt(min, max) generates an integer in the range [min, max)
  // so the upper bound is exclusive. To include 999999 we must use 1000000.
  return crypto.randomInt(100000, 1000000).toString();
}

// Send OTP via email
export async function sendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate email
    if (!email || !validator.isEmail(email)) {
      return { success: false, message: 'Invalid email address' };
    }

    if (!EMAIL_CONFIGURED || !transporter) {
      // Fail gracefully when email transport isn't configured (useful during build/test)
      return { success: false, message: 'Email service not configured' };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for recent OTP requests (prevent spam)
    const recentOTPCount = await prisma.oTPVerification.count({
      where: {
        email: normalizedEmail,
        created_at: {
          gte: new Date(Date.now() - 1 * 60 * 1000) // Last 1 minute
        }
      }
    });

    if (recentOTPCount > 0) {
      return { 
        success: false, 
        message: 'Please wait before requesting a new OTP' 
      };
    }

    // Generate OTP
    const otpCode = generateOTP();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Clean up any expired OTPs first
    await cleanupExpiredOTPs();
    
    // Delete any existing unused OTPs for this email
    await prisma.oTPVerification.deleteMany({
      where: { 
        email: normalizedEmail,
        is_used: false 
      }
    });
    
    // Store OTP in database first
    const otpRecord = await prisma.oTPVerification.create({
      data: {
        email: normalizedEmail,
        otp_code: otpCode,
        expires_at: expiresAt,
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
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
    console.log(`OTP sent successfully to: ${normalizedEmail}`);
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // If email failed, delete the OTP record
    if (email) {
      try {
        await prisma.oTPVerification.deleteMany({
          where: { 
            email: email.toLowerCase().trim(),
            is_used: false 
          }
        });
      } catch (deleteError) {
        console.error('Error cleaning up failed OTP:', deleteError);
      }
    }
    
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    };
  }
}

// Verify OTP
export async function verifyOTP(email: string, otpCode: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate inputs
    if (!email || !validator.isEmail(email)) {
      return { success: false, message: 'Invalid email address' };
    }

    if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      return { success: false, message: 'Invalid OTP format' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOTP = otpCode.trim();

    // Clean up expired OTPs first
    await cleanupExpiredOTPs();

    // Check for too many attempts
    const recentAttempts = await prisma.oTPVerification.count({
      where: {
        email: normalizedEmail,
        created_at: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentAttempts > 10) {
      return { 
        success: false, 
        message: 'Too many verification attempts. Please request a new OTP.' 
      };
    }

    // Find the OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email: normalizedEmail,
        otp_code: normalizedOTP,
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
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    });

    console.log(`OTP verified successfully for: ${normalizedEmail}`);
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    };
  }
}

// Clean up expired OTPs
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const result = await prisma.oTPVerification.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { 
            AND: [
              { is_used: true },
              { created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Older than 24 hours
            ]
          }
        ]
      }
    });
    
    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} expired OTP records`);
    }
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

// Optional: Resend OTP
export async function resendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Clean up any existing unused OTPs
    await prisma.oTPVerification.deleteMany({
      where: { 
        email: email.toLowerCase().trim(),
        is_used: false 
      }
    });
    
    // Send new OTP
    return await sendOTP(email);
  } catch (error) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      message: 'Failed to resend OTP'
    };
  }
}