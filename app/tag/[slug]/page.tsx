"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string
  featured_image?: string
  published_at: string
  author: {
    name: string
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

interface Tag {
  id: number
  name: string
  post_count: number
}

export default function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [posts, setPosts] = useState<Post[]>([])
  const [tag, setTag] = useState<Tag | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTagPosts()
  }, [slug])

  const fetchTagPosts = async () => {
    try {
      const [postsRes, tagsRes] = await Promise.all([fetch(`/api/posts/search?tag=${slug}`), fetch("/api/tags")])

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts)
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        const foundTag = tagsData.find((t: Tag) => t.slug === slug)
        setTag(foundTag)
      }
    } catch (error) {
      console.error("Error fetching tag posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!tag) {
    return <div className="container mx-auto px-4 py-8">Tag not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">#{tag.name}</h1>
        <p className="text-sm text-muted-foreground">
          {tag.post_count} {tag.post_count === 1 ? "post" : "posts"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts found with this tag.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
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
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.category && (
                    <Badge variant="outline">
                      <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
                    </Badge>
                  )}
                  {post.tags
                    .filter((t) => t.slug !== params.slug)
                    .map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        <Link href={`/tag/${tag.slug}`}>{tag.name}</Link>
                      </Badge>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  By {post.author.name} • {new Date(post.published_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
