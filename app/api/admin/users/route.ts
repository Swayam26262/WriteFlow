import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken, getUserById } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(payload.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all users with post counts
    const users = await sql`
      SELECT 
        u.id, u.name, u.email, u.role, u.is_verified, u.created_at,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id AND p.status = 'published'
      GROUP BY u.id, u.name, u.email, u.role, u.is_verified, u.created_at
      ORDER BY u.created_at DESC
    `

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
