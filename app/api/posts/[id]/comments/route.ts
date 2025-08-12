import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // Get all comments for the post with user info
    const comments = await sql`
      SELECT c.*, u.name as author_name, u.email as author_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `

    // Build threaded comment structure
    const commentMap = new Map()
    const rootComments: any[] = []

    // First pass: create comment objects
    comments.forEach((comment) => {
      const commentObj = {
        ...comment,
        author: {
          id: comment.user_id,
          name: comment.author_name,
          email: comment.author_email,
        },
        replies: [],
      }
      commentMap.set(comment.id, commentObj)
    })

    // Second pass: build hierarchy
    comments.forEach((comment) => {
      const commentObj = commentMap.get(comment.id)
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentObj)
        }
      } else {
        rootComments.push(commentObj)
      }
    })

    return NextResponse.json(rootComments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, parentId } = await request.json()
    const postId = params.id

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Create comment
    const comment = await sql`
      INSERT INTO comments (post_id, user_id, content, parent_id)
      VALUES (${postId}, ${user.id}, ${content.trim()}, ${parentId || null})
      RETURNING *
    `

    // Get user info for response
    const userInfo = await sql`
      SELECT name, email FROM users WHERE id = ${user.id}
    `

    const newComment = {
      ...comment[0],
      author: {
        id: user.id,
        name: userInfo[0].name,
        email: userInfo[0].email,
      },
      replies: [],
    }

    return NextResponse.json(newComment)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
