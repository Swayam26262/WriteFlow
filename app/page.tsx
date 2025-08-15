"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PostSearch, type SearchFilters } from "@/components/post-search"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, BookOpen, Users, FileText, Mail, TrendingUp, Clock } from "lucide-react"

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
  const [email, setEmail] = useState("")
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState("")

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

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setSubscribeMessage("Please enter a valid email address")
      return
    }

    setSubscribeLoading(true)
    setSubscribeMessage("")

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribeMessage("Successfully subscribed! Check your email for confirmation.")
        setEmail("")
      } else {
        setSubscribeMessage(data.error || "Failed to subscribe. Please try again.")
      }
    } catch (error) {
      setSubscribeMessage("Something went wrong. Please try again.")
    } finally {
      setSubscribeLoading(false)
    }
  }

  // Calculate reading time (rough estimate)
  const getReadingTime = (excerpt: string) => {
    const wordsPerMinute = 200
    const wordCount = excerpt.split(' ').length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return readingTime
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-30"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200 rounded-full blur-xl opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 text-center leading-tight">
              Welcome to WriteFlow
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Discover amazing stories from our community of writers. Read, engage, and share your own stories.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                onClick={() => router.push('/dashboard/posts/new')}
              >
                Start Writing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-300 hover:border-gray-400 px-8 py-3 text-lg"
                onClick={() => router.push('/posts')}
              >
                Explore Posts
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>100+ Stories</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>50+ Writers</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span>20+ Categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Latest Posts Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-3xl font-bold mb-4 md:mb-0">Latest Posts</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Fresh content from our community</span>
            </div>
          </div>
          <PostSearch onSearch={handleSearch} loading={loading} />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading amazing stories...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-gray-600 mb-6">Be the first to share your story!</p>
            <Button onClick={() => router.push('/dashboard/posts/new')}>
              Write Your First Post
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
                  onClick={() => router.push(`/posts/${post.slug}`)}
                >
                  {post.featured_image && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.featured_image || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 text-lg group-hover:text-blue-600 transition-colors duration-200">
                      <Link href={`/posts/${post.slug}`} className="hover:text-blue-600">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                    
                    {/* Engagement metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <span className="text-red-500">❤</span> {post.like_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-blue-500">👁</span> {post.view_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getReadingTime(post.excerpt)} min read
                      </span>
                    </div>

                    {/* Categories and tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.category && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <Badge variant="outline" className="hover:bg-blue-50 transition-colors">
                            <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
                          </Badge>
                        </span>
                      )}
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag.id} onClick={(e) => e.stopPropagation()}>
                          <Badge variant="secondary" className="hover:bg-gray-100 transition-colors">
                            <Link href={`/tag/${tag.slug}`}>{tag.name}</Link>
                          </Badge>
                        </span>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{post.tags.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Author info */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {post.author.profile_picture && (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          <Image src={post.author.profile_picture} alt={post.author.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.author.name}</p>
                        <p className="text-xs text-gray-500">{new Date(post.published_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</p>
                      </div>
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
                  className="px-6"
                >
                  Previous
                </Button>
                <span className="flex items-center px-6 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-6"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter Signup Section */}
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Get the latest stories and writing tips delivered to your inbox every week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                onClick={handleSubscribe}
                disabled={subscribeLoading}
              >
                {subscribeLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {subscribeLoading ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
            {subscribeMessage && (
              <p className={`mt-4 text-sm ${subscribeMessage.includes("Successfully") ? "text-green-600" : "text-red-600"}`}>
                {subscribeMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
