# Newsletter Email Setup Guide

This guide will help you set up the newsletter email functionality for WriteFlow.

## Prerequisites

1. **Gmail Account**: You'll need a Gmail account to send emails
2. **App Password**: Generate an app password for your Gmail account (don't use your regular password)

## Step 1: Generate Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification" (enable if not already enabled)
3. Go to "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Name it "WriteFlow Newsletter"
6. Copy the generated 16-character password

## Step 2: Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Step 3: Database Setup

Run the newsletter database migration:

```sql
-- Run this SQL script in your database
-- File: scripts/05-add-newsletter-table.sql
```

## Step 4: Test the Setup

1. Start your development server: `npm run dev`
2. Go to your homepage and try subscribing to the newsletter
3. Check your email for the confirmation message
4. Test the admin panel at `/admin/newsletter`

## Features Implemented

### 1. Newsletter Subscription
- Users can subscribe via the homepage
- Email validation and confirmation
- Database storage of subscribers
- Welcome email sent automatically

### 2. Admin Management
- View all subscribers (active/inactive)
- Send custom newsletters
- Export subscriber list to CSV
- Statistics dashboard

### 3. Automatic Notifications
- API endpoint to send notifications when new posts are published
- Can be integrated with your post creation workflow

### 4. Unsubscribe Functionality
- Users can unsubscribe via email link
- Database tracking of unsubscribe status

## API Endpoints

### Public Endpoints
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter

### Admin Endpoints
- `GET /api/admin/newsletter/subscribers` - Get all subscribers
- `POST /api/admin/newsletter/send` - Send custom newsletter
- `POST /api/newsletter/send` - Send post notification (for new posts)

## Integration with Post Creation

To automatically send newsletters when new posts are published, add this to your post creation API:

```javascript
// After successfully creating a post
const newsletterResponse = await fetch('/api/newsletter/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postId: newPost.id,
    postTitle: newPost.title,
    postExcerpt: newPost.excerpt,
    postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${newPost.slug}`
  })
})
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Make sure you're using an app password, not your regular Gmail password
2. **Emails Not Sending**: Check your Gmail account settings and ensure "Less secure app access" is enabled
3. **Database Errors**: Ensure the newsletter table is created properly
4. **Environment Variables**: Verify all environment variables are set correctly

### Gmail Settings

- Enable 2-Step Verification
- Generate app password specifically for this application
- Don't use your main Gmail password

## Security Notes

- Never commit your email credentials to version control
- Use environment variables for all sensitive information
- Consider using a dedicated email service (SendGrid, Mailgun) for production
- Implement rate limiting for subscription endpoints

## Production Considerations

For production deployment:

1. **Email Service**: Consider using a dedicated email service like SendGrid or Mailgun
2. **Rate Limiting**: Implement rate limiting to prevent spam
3. **Email Templates**: Create professional email templates
4. **Analytics**: Track email open rates and click-through rates
5. **Compliance**: Ensure GDPR compliance for EU users

## Support

If you encounter any issues, check:
1. Environment variables are set correctly
2. Database migration is completed
3. Gmail app password is valid
4. Network connectivity for email sending
