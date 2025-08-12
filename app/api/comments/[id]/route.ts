import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()
    const commentId = params.id

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Update comment (only if user owns it)
    const comment = await sql`
      UPDATE comments 
      SET content = ${content.trim()}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${commentId} AND user_id = ${user.id}
      RETURNING *
    `

    if (comment.length === 0) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json(comment[0])
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Check if user owns the comment or is admin
    const comment = await sql`
      SELECT * FROM comments WHERE id = ${commentId}
    `

    if (comment.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment[0].user_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete comment and its replies
    await sql`DELETE FROM comments WHERE id = ${commentId} OR parent_id = ${commentId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
