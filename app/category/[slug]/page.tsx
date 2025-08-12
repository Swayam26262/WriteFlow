"use client"

import { useState, useEffect } from "react"
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
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface Category {
  id: number
  name: string
  description?: string
  post_count: number
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoryPosts()
  }, [params.slug])

  const fetchCategoryPosts = async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(`/api/posts/search?category=${params.slug}`),
        fetch("/api/categories"),
      ])

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const foundCategory = categoriesData.find((cat: Category) => cat.slug === params.slug)
        setCategory(foundCategory)
      }
    } catch (error) {
      console.error("Error fetching category posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!category) {
    return <div className="container mx-auto px-4 py-8">Category not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && <p className="text-lg text-muted-foreground mb-4">{category.description}</p>}
        <p className="text-sm text-muted-foreground">
          {category.post_count} {category.post_count === 1 ? "post" : "posts"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts found in this category.</p>
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
                  {post.tags.map((tag) => (
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
