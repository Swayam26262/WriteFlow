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

    const { name, description } = await request.json()
    const categoryId = params.id

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = generateSlug(name)

    const category = await sql`
      UPDATE categories 
      SET name = ${name.trim()}, slug = ${slug}, description = ${description?.trim() || null}
      WHERE id = ${categoryId}
      RETURNING *
    `

    if (category.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category[0])
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categoryId = params.id

    // Check if category has posts
    const posts = await sql`
      SELECT COUNT(*) as count FROM posts WHERE category_id = ${categoryId}
    `

    if (Number.parseInt(posts[0].count) > 0) {
      return NextResponse.json({ error: "Cannot delete category with existing posts" }, { status: 400 })
    }

    await sql`DELETE FROM categories WHERE id = ${categoryId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
