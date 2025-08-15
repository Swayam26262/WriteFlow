import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    if (!purpose || purpose !== 'author_verification') {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      )
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in database
    await sql`
      INSERT INTO otp_codes (email, otp, purpose, expires_at)
      VALUES (${email}, ${otp}, ${purpose}, ${expiresAt.toISOString()})
      ON CONFLICT (email, purpose) 
      DO UPDATE SET 
        otp = ${otp},
        expires_at = ${expiresAt.toISOString()},
        created_at = CURRENT_TIMESTAMP
    `

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Email content for OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'WriteFlow - Author Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">Author Verification</h1>
            <p style="color: #6b7280; font-size: 18px;">You're one step away from becoming an author!</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Your Verification Code</h2>
            <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #374151; font-size: 14px;">
              This code will expire in 10 minutes.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-bottom: 10px;">Security Notice</h3>
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              • Never share this code with anyone<br>
              • WriteFlow will never ask for this code via phone or text<br>
              • If you didn't request this code, please ignore this email
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/become-author" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Verification
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This email was sent to verify your author account on WriteFlow.</p>
          </div>
        </div>
      `,
    }

    // Send OTP email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('OTP sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
