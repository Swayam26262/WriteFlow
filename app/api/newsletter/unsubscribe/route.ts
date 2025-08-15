import { NextRequest, NextResponse } from 'next/server'
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

    // Update subscriber to inactive
    const result = await sql`
      UPDATE newsletter_subscribers 
      SET is_active = false, unsubscribed_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Email not found in our subscribers list' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Successfully unsubscribed from newsletter' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
