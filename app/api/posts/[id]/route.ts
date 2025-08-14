import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"
import { getPostById, updatePost, deletePost } from "@/lib/posts"

const sql = neon(process.env.DATABASE_URL!)

// Increment view count and return current metrics
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    await sql`
      UPDATE posts
      SET view_count = view_count + 1
      WHERE id = ${postId}
    `

    const result = await sql`
      SELECT view_count, like_count FROM posts WHERE id = ${postId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({
      viewCount: result[0].view_count,
      likeCount: result[0].like_count,
    })
  } catch (error) {
    console.error("Error incrementing view count:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = Number.parseInt(params.id)
    const post = await getPostById(postId)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const postId = Number.parseInt(params.id)
    const postData = await request.json()

    const updatedPost = await updatePost(postId, payload.userId, postData)

    if (!updatedPost) {
      return NextResponse.json({ error: "Failed to update post or post not found" }, { status: 404 })
    }

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const postId = Number.parseInt(params.id)
    const success = await deletePost(postId, payload.userId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete post or post not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
