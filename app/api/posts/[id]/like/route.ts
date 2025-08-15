import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = id

    // Check if user already liked this post
    const existingLike = await sql`
      SELECT id FROM likes WHERE user_id = ${payload.userId} AND post_id = ${postId}
    `

    if (existingLike.length > 0) {
      // Unlike the post
      await sql`DELETE FROM likes WHERE user_id = ${payload.userId} AND post_id = ${postId}`

      // Update post like count
      await sql`
        UPDATE posts 
        SET like_count = like_count - 1 
        WHERE id = ${postId}
      `

      return NextResponse.json({ liked: false })
    } else {
      // Like the post
      await sql`
        INSERT INTO likes (user_id, post_id)
        VALUES (${payload.userId}, ${postId})
      `

      // Update post like count
      await sql`
        UPDATE posts 
        SET like_count = like_count + 1 
        WHERE id = ${postId}
      `

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.cookies.get("auth-token")?.value
    const payload = token ? verifyToken(token) : null
    const postId = id

    // Get like count
    const post = await sql`
      SELECT like_count FROM posts WHERE id = ${postId}
    `

    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    let userLiked = false
    if (payload) {
      const userLike = await sql`
        SELECT id FROM likes WHERE user_id = ${payload.userId} AND post_id = ${postId}
      `
      userLiked = userLike.length > 0
    }

    return NextResponse.json({
      likeCount: post[0].like_count,
      userLiked,
    })
  } catch (error) {
    console.error("Error fetching like status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
