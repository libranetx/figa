import nodemailer from 'nodemailer';
import { prisma } from '@/prisma/client';
import crypto from 'crypto';
import validator from 'validator';

// Vercel environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const VERCEL_ENV = process.env.VERCEL_ENV || 'development';

// Check if email is configured
const isEmailConfigured = !!(EMAIL_USER && EMAIL_PASSWORD);

// Create transporter only if credentials are available
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
    // Optimized for Vercel serverless functions
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
  });

  // Test connection (but don't block startup)
  transporter.verify().then(() => {
    console.log('✅ Email server is ready');
  }).catch((error) => {
    console.error('❌ Email configuration error:', error.message);
  });
} else {
  console.warn('⚠️ Email not configured - check Vercel environment variables');
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function sendOTP(email: string, purpose: 'verify' | 'reset' = 'verify'): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📧 OTP request for: ${email} (Environment: ${VERCEL_ENV})`);
    
    // Validate email
    if (!email || !validator.isEmail(email)) {
      return { success: false, message: 'Invalid email address' };
    }

    // Check email configuration
    if (!isEmailConfigured || !transporter) {
      const missingVars = [];
      if (!EMAIL_USER) missingVars.push('EMAIL_USER');
      if (!EMAIL_PASSWORD) missingVars.push('EMAIL_PASSWORD');
      
      console.error(`❌ Email not configured. Missing: ${missingVars.join(', ')}`);
      return { 
        success: false, 
        message: 'Email service is temporarily unavailable. Please try again later.' 
      };
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
  // Shorten OTP lifetime to 1 minute
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
    
    console.log(`🔑 Generated OTP for ${normalizedEmail}: ${otpCode}`);
    
    // Clean up expired OTPs
    await cleanupExpiredOTPs();
    
    // Delete existing unused OTPs
    await prisma.oTPVerification.deleteMany({
      where: { 
        email: normalizedEmail,
        is_used: false 
      }
    });
    
    // Store OTP in database
    await prisma.oTPVerification.create({
      data: {
        email: normalizedEmail,
        otp_code: otpCode,
        expires_at: expiresAt,
      }
    });
    
    // Email configuration
    // Different email templates depending on purpose
    const subject = purpose === 'reset'
      ? 'FIGA Care - Password Reset Code'
      : 'FIGA Care - Email Verification Code';

    const intro = purpose === 'reset'
      ? 'You requested to reset your FIGA Care password. Use the code below to continue and set a new password.'
      : 'To complete your account setup, please use the verification code below:';

    const mailOptions = {
      from: {
        name: 'FIGA Care',
        address: EMAIL_USER!
      },
      to: normalizedEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FIGA Care</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your trusted partner in care</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">${purpose === 'reset' ? 'Password Reset' : 'Email Verification'}</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
              ${intro}
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 5px; font-family: monospace;">
                ${otpCode}
              </div>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0;">
              This code will expire in <strong>1 minute</strong>. If you didn't request this, please ignore this email or contact support.
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
    
    console.log('📤 Attempting to send email...');
    
    // Send email
    const emailResult = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${emailResult.messageId}`);
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
    
  } catch (error: any) {
    console.error('❌ Error sending OTP:', {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode
    });
    
    // Clean up on failure
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
    
    // Provide specific error messages
    let errorMessage = 'Failed to send OTP. Please try again.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email configuration.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Cannot connect to email service. Please try again.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Email authentication failed. Please check your email password.';
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}

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

    console.log(`✅ OTP verified successfully for: ${normalizedEmail}`);
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    };
  }
}

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
      console.log(`🧹 Cleaned up ${result.count} expired OTP records`);
    }
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

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