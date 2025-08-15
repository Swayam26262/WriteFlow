"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PostForm, type PostFormData } from "@/components/post-form"
import type { Post } from "@/lib/posts"

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      router.push("/dashboard")
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (data: PostFormData) => {
    setLoading(true)
    try {
      console.log("Submitting post data:", data)
      
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const updatedPost = await response.json()
        console.log("Post updated successfully:", updatedPost)
        setPost(updatedPost)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Server error response:", errorData)
        throw new Error(errorData.error || `Failed to update post (${response.status})`)
      }
    } catch (error) {
      console.error("Error updating post:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading post...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Post not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Edit Post</h1>
              <p className="text-gray-600">{post.title}</p>
            </div>
            <div className="flex gap-2">
              {post.status === "published" && (
                <Button variant="outline" asChild>
                  <Link href={`/posts/${post.slug}`}>View Post</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PostForm post={post} onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  )
}
