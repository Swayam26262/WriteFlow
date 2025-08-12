import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const media = await sql`
      SELECT id, filename, original_name, url, size, type, created_at
      FROM media 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalCount = await sql`
      SELECT COUNT(*) as count FROM media WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total: Number.parseInt(totalCount[0].count),
        pages: Math.ceil(Number.parseInt(totalCount[0].count) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
