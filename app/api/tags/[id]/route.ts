import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"
import { generateSlug } from "@/lib/posts"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()
    const tagId = params.id

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = generateSlug(name)

    const tag = await sql`
      UPDATE tags 
      SET name = ${name.trim()}, slug = ${slug}
      WHERE id = ${tagId}
      RETURNING *
    `

    if (tag.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json(tag[0])
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tagId = params.id

    // Delete tag associations first
    await sql`DELETE FROM post_tags WHERE tag_id = ${tagId}`

    // Delete the tag
    await sql`DELETE FROM tags WHERE id = ${tagId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
