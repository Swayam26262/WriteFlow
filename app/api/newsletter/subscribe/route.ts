import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!)

    // Create transporter (you'll need to provide your email credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email password or app password
      },
    })

    // Email content for confirmation
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to WriteFlow Newsletter! 📝',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to WriteFlow!</h1>
            <p style="color: #6b7280; font-size: 18px;">You've successfully subscribed to our newsletter.</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">What to expect:</h2>
            <ul style="color: #374151; line-height: 1.6;">
              <li>📖 Latest blog posts from our community</li>
              <li>✍️ Writing tips and inspiration</li>
              <li>🎯 Featured stories and authors</li>
              <li>📅 Weekly roundups of the best content</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Visit WriteFlow
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>You can unsubscribe at any time by clicking the link in our emails.</p>
          </div>
        </div>
      `,
    }

    // Store email in database
    try {
      await sql`
        INSERT INTO newsletter_subscribers (email)
        VALUES (${email})
        ON CONFLICT (email) 
        DO UPDATE SET 
          is_active = true,
          unsubscribed_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue with email sending even if database fails
    }

    // Send confirmation email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}
