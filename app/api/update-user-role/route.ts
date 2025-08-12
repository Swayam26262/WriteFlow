import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { email, newRole } = await request.json()
    
    console.log(`Updating user ${email} to role ${newRole}`)
    
    const result = await sql`
      UPDATE users 
      SET role = ${newRole}
      WHERE email = ${email}
      RETURNING id, email, name, role
    `
    
    if (result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 })
    }
    
    console.log("User updated:", result[0])
    
    return NextResponse.json({ 
      success: true, 
      user: result[0],
      message: `User ${email} role updated to ${newRole}`
    })
  } catch (error) {
    console.error("Update user role error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
