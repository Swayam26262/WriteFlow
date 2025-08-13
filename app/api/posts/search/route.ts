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

    console.log("Search params:", { query, category, tag, page, limit, offset })

    // Build the base query
    let postsQuery = sql`
      SELECT p.*, u.name as author_name, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
    `

    // Add search conditions
    if (query.trim()) {
      postsQuery = sql`
        ${postsQuery}
        AND (p.title ILIKE ${`%${query.trim()}%`} OR p.content ILIKE ${`%${query.trim()}%`} OR p.excerpt ILIKE ${`%${query.trim()}%`})
      `
    }

    if (category) {
      postsQuery = sql`
        ${postsQuery}
        AND c.slug = ${category}
      `
    }

    if (tag) {
      postsQuery = sql`
        ${postsQuery}
        AND EXISTS (
          SELECT 1 FROM post_tags pt 
          JOIN tags t ON pt.tag_id = t.id 
          WHERE pt.post_id = p.id AND t.slug = ${tag}
        )
      `
    }

    // Add ordering and pagination
    postsQuery = sql`
      ${postsQuery}
      ORDER BY p.published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log("Executing posts query...")
    const posts = await postsQuery
    
    console.log("Posts result type:", typeof posts)
    console.log("Posts result length:", posts?.length || 0)
    console.log("First post:", posts?.[0] || "No posts")

    // Handle case where no posts are found
    if (!posts || posts.length === 0) {
      console.log("No posts found, returning empty array")
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      })
    }

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
    let countQuery = sql`
      SELECT COUNT(*) as count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
    `

    if (query.trim()) {
      countQuery = sql`
        ${countQuery}
        AND (p.title ILIKE ${`%${query.trim()}%`} OR p.content ILIKE ${`%${query.trim()}%`} OR p.excerpt ILIKE ${`%${query.trim()}%`})
      `
    }

    if (category) {
      countQuery = sql`
        ${countQuery}
        AND c.slug = ${category}
      `
    }

    if (tag) {
      countQuery = sql`
        ${countQuery}
        AND EXISTS (
          SELECT 1 FROM post_tags pt 
          JOIN tags t ON pt.tag_id = t.id 
          WHERE pt.post_id = p.id AND t.slug = ${tag}
        )
      `
    }

    const countResult = await countQuery
    const total = Number.parseInt(countResult[0].count)

    console.log("Total posts count:", total)

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
