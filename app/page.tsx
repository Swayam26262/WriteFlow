"use client"

import { useState, useEffect } from "react"
import { allura } from "@/lib/fonts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PostSearch, type SearchFilters } from "@/components/post-search"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

  interface Post {
  id: number
  title: string
  slug: string
  excerpt: string
  featured_image?: string
  published_at: string
    like_count?: number
    view_count?: number
  author: {
    name: string
    profile_picture?: string
  }
  category?: {
    name: string
    slug: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    handleSearch({ query: "", category: "", tag: "" })
  }, [])

  const handleSearch = async (filters: SearchFilters, page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.query) params.append("q", filters.query)
      if (filters.category) params.append("category", filters.category)
      if (filters.tag) params.append("tag", filters.tag)

      const response = await fetch(`/api/posts/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error searching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    const currentFilters = { query: "", category: "", tag: "" }
    handleSearch(currentFilters, newPage)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className={`text-6xl md:text-7xl font-bold text-gray-900 mb-6 text-center leading-tight ${allura.className}`}>
              Welcome to WriteFlow
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover amazing stories from our community of writers. Read, engage, and share your own stories.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Latest Posts</h2>
          <PostSearch onSearch={handleSearch} loading={loading} />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/posts/${post.slug}`)}
                >
                  {post.featured_image && (
                    <div className="relative aspect-video">
                      <Image
                        src={post.featured_image || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/posts/${post.slug}`} className="hover:text-primary">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span>❤ {post.like_count ?? 0}</span>
                      <span>👁 {post.view_count ?? 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.category && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <Badge variant="outline">
                            <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
                          </Badge>
                        </span>
                      )}
                      {post.tags.map((tag) => (
                        <span key={tag.id} onClick={(e) => e.stopPropagation()}>
                          <Badge variant="secondary">
                            <Link href={`/tag/${tag.slug}`}>{tag.name}</Link>
                          </Badge>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {post.author.profile_picture && (
                        <span className="relative h-6 w-6 overflow-hidden rounded-full border">
                          <Image src={post.author.profile_picture} alt={post.author.name} fill className="object-cover" />
                        </span>
                      )}
                      <span>By {post.author.name} • {new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
