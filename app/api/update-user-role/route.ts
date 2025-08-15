import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { role, bio, profile_picture, social_links, otp } = await request.json()

    // Only allow upgrading from reader to author
    if (user.role !== "reader" || role !== "author") {
      return NextResponse.json({ error: "Invalid role upgrade" }, { status: 400 })
    }

    // Verify OTP if provided
    if (otp) {
      const otpRecord = await sql`
        SELECT * FROM otp_codes 
        WHERE email = ${user.email} 
        AND purpose = 'author_verification' 
        AND expires_at > NOW()
        ORDER BY created_at DESC 
        LIMIT 1
      `

      if (!otpRecord[0] || otpRecord[0].otp !== otp) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
      }

      // Delete the used OTP
      await sql`
        DELETE FROM otp_codes 
        WHERE email = ${user.email} 
        AND purpose = 'author_verification'
      `
    } else {
      return NextResponse.json({ error: "OTP verification required" }, { status: 400 })
    }

    // Update user role and profile information
    const updatedUser = await sql`
      UPDATE users 
      SET 
        role = ${role},
        bio = ${bio || null},
        profile_picture = ${profile_picture || null},
        social_links = ${social_links ? JSON.stringify(social_links) : null}
      WHERE id = ${user.id}
      RETURNING id, email, name, bio, profile_picture, social_links, role, is_verified, created_at
    `

    if (!updatedUser[0]) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({
      user: updatedUser[0],
      message: "Successfully upgraded to author",
    })
  } catch (error) {
    console.error("Update user role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
