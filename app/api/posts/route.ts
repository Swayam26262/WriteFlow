import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getUserById } from "@/lib/auth"
import { createPost, searchPosts } from "@/lib/posts"

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

    const postData = await request.json()
    console.log("Creating post with data:", { ...postData, content: postData.content?.substring(0, 100) + "..." })
    
    const post = await createPost(user.id, postData)

    if (!post) {
      console.error("createPost returned null")
      return NextResponse.json({ error: "Failed to create post - database operation failed" }, { status: 500 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category") || ""
    const tag = searchParams.get("tag") || ""

    const posts = await searchPosts({
      query,
      category,
      tag,
      page,
      limit,
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
