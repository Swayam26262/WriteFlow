import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken, getUserById } from "@/lib/auth"
import { generateSlug } from "@/lib/posts"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const tags = await sql`
      SELECT t.*, COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id, t.name, t.slug, t.created_at
      ORDER BY t.name ASC
    `
    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    if (!user || (user.role !== "author" && user.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const slug = generateSlug(name)

    const tag = await sql`
      INSERT INTO tags (name, slug)
      VALUES (${name.trim()}, ${slug})
      RETURNING *
    `

    if (!tag[0]) {
      return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
    }

    console.log("Tag created successfully:", tag[0])
    return NextResponse.json({
      ...tag[0],
      message: "Tag created successfully"
    })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
