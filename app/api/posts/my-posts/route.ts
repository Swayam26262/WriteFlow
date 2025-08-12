import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getPostsByAuthor } from "@/lib/posts"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const posts = await getPostsByAuthor(payload.userId)
    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching user posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
