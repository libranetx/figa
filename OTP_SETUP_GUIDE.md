# OTP Email Configuration Guide

## Environment Variables Required

Add these variables to your `.env.local` file:

```bash
# Gmail SMTP Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to **Google Account settings** > **Security** > **App passwords**
3. Generate an **app password** for "Mail"
4. Use that app password as `EMAIL_PASSWORD` (not your regular Gmail password)

## Alternative SMTP Providers

If you want to use other email providers, modify the transporter configuration in `lib/otp-service.ts`:

### Outlook/Hotmail
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

## Vercel Deployment

For Vercel deployment, add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add the required email configuration variables
4. Redeploy your application

## Testing

To test the OTP functionality:

1. Set up your email credentials
2. Run the database migration: `npx prisma migrate dev`
3. Start the development server: `npm run dev`
4. Try signing up with a valid email address
5. Check your email for the OTP code
6. Enter the code on the verification page

## Security Notes

- Never commit your email credentials to version control
- Use app passwords instead of regular passwords
- Consider using a dedicated email service like SendGrid or Mailgun for production
- OTP codes expire after 1 minute for security
