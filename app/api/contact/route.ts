import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, service, message } = body;

    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }

    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.error('Email credentials not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    const to = 'tadiostsegaye7@gmail.com';

    const subject = `Contact form: ${firstName || ''} ${lastName || ''}`.trim();

    const html = `
      <h2>New contact message from FIGA site</h2>
      <p><strong>Name:</strong> ${firstName || ''} ${lastName || ''}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Service:</strong> ${service || 'N/A'}</p>
      <hr />
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `;

    const mailOptions = {
      from: `${firstName || 'Website Visitor'} <${EMAIL_USER}>`,
      to,
      subject,
      html,
      replyTo: email,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.messageId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending contact email:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
