# Email Verification Setup Guide

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Email Service Setup

### Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

### Alternative Email Services

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
```

## Testing Email Configuration

The system will automatically test the email configuration on startup. Check the console logs for:
- ✅ "Email service is ready" - Configuration is working
- ❌ "Email service configuration error" - Check your settings

## Email Templates

The system sends beautiful HTML emails with:
- Crime City branding
- Verification links
- Professional styling
- Mobile-responsive design

## Security Features

- Verification tokens expire in 24 hours
- Tokens are cryptographically secure
- One-time use tokens
- Automatic cleanup of expired tokens

## Troubleshooting

### Common Issues:
1. **"Email service configuration error"**
   - Check SMTP credentials
   - Verify app password (not regular password)
   - Check firewall/network restrictions

2. **"Failed to send verification email"**
   - Check email address format
   - Verify SMTP server is accessible
   - Check spam folder

3. **"Invalid or expired verification token"**
   - Tokens expire after 24 hours
   - Use "Resend Verification" button
   - Check email for new verification link

## Production Deployment

For production, consider using:
- **SendGrid** - Reliable email delivery
- **Mailgun** - Developer-friendly email service
- **AWS SES** - Cost-effective for high volume
- **Postmark** - Transactional email specialist

Update your `BASE_URL` to your production domain for proper verification links.
