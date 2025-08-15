import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!)

    // Get all subscribers
    const subscribers = await sql`
      SELECT id, email, is_active, subscribed_at, unsubscribed_at
      FROM newsletter_subscribers
      ORDER BY subscribed_at DESC
    `

    return NextResponse.json(
      { subscribers },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}
