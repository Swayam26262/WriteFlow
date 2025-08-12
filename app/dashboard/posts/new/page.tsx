"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PostForm, type PostFormData } from "@/components/post-form"
import { useState } from "react"

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: PostFormData) => {
    setLoading(true)
    try {
      console.log("Submitting post data:", { ...data, content: data.content?.substring(0, 100) + "..." })
      
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const post = await response.json()
        console.log("Post created successfully:", post)
        router.push(`/dashboard/posts/${post.id}/edit`)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Server error response:", errorData)
        throw new Error(errorData.error || `Failed to create post (${response.status})`)
      }
    } catch (error) {
      console.error("Error creating post:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Create New Post</h1>
              <p className="text-gray-600">Write and publish your blog post</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PostForm onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  )
}
