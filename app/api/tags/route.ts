import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"
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
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    return NextResponse.json(tag[0])
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
