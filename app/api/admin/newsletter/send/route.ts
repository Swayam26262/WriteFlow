import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const { subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!)

    // Get all active subscribers
    const subscribers = await sql`
      SELECT email FROM newsletter_subscribers 
      WHERE is_active = true
    `

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Email content for custom newsletter
    const mailOptions = {
      from: process.env.EMAIL_USER,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">WriteFlow Newsletter</h1>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Visit WriteFlow
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>You're receiving this because you subscribed to WriteFlow newsletter.</p>
            <p><a href="#" style="color: #6b7280;">Unsubscribe</a></p>
          </div>
        </div>
      `,
    }

    // Send emails to all subscribers
    const emailPromises = subscribers.map(subscriber => {
      return transporter.sendMail({
        ...mailOptions,
        to: subscriber.email,
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json(
      { 
        message: `Newsletter sent to ${subscribers.length} subscribers`,
        subscriberCount: subscribers.length
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Newsletter sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
