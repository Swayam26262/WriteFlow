import { list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

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

    const { blobs } = await list()

    // Filter images by user (based on filename prefix)
    const userImages = blobs
      .filter((blob) => blob.pathname.startsWith(`${payload.userId}-`))
      .map((blob) => ({
        url: blob.url,
        filename: blob.pathname.split("/").pop() || "unknown",
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))

    return NextResponse.json({ images: userImages })
  } catch (error) {
    console.error("Error listing images:", error)
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Verify user owns this image (check filename prefix)
    const filename = url.split("/").pop()
    if (!filename?.startsWith(`${payload.userId}-`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
