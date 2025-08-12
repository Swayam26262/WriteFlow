import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const mediaId = params.id

    // Get media info
    const media = await sql`
      SELECT * FROM media WHERE id = ${mediaId} AND user_id = ${user.id}
    `

    if (media.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(media[0].url)

    // Delete from database
    await sql`
      DELETE FROM media WHERE id = ${mediaId} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
