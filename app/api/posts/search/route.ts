import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const whereConditions = ["p.status = 'published'"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (query.trim()) {
      whereConditions.push(
        `(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex} OR p.excerpt ILIKE $${paramIndex})`,
      )
      queryParams.push(`%${query.trim()}%`)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`c.slug = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (tag) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM post_tags pt 
        JOIN tags t ON pt.tag_id = t.id 
        WHERE pt.post_id = p.id AND t.slug = $${paramIndex}
      )`)
      queryParams.push(tag)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const postsQuery = `
      SELECT p.*, u.name as author_name, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const posts = await sql.unsafe(postsQuery, queryParams)

    // Get tags for each post
    const postsWithTags = await Promise.all(
      posts.map(async (post) => {
        const tags = await sql`
          SELECT t.id, t.name, t.slug
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ${post.id}
        `

        return {
          ...post,
          author: {
            id: post.author_id,
            name: post.author_name,
          },
          category: post.category_name
            ? {
                id: post.category_id,
                name: post.category_name,
                slug: post.category_slug,
              }
            : null,
          tags,
        }
      }),
    )

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `
    const countResult = await sql.unsafe(countQuery, queryParams.slice(0, -2))
    const total = Number.parseInt(countResult[0].count)

    return NextResponse.json({
      posts: postsWithTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
