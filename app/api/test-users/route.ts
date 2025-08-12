import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("Testing users in database...")
    
    // Get all users
    const users = await sql`
      SELECT id, email, name, role, is_verified, created_at
      FROM users 
      ORDER BY created_at DESC
    `
    
    console.log("Users found:", users.length)
    console.log("Users:", users)
    
    return NextResponse.json({ 
      success: true, 
      userCount: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_verified: user.is_verified
      }))
    })
  } catch (error) {
    console.error("Users test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
