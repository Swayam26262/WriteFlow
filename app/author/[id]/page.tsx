import { notFound } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, LinkIcon, Globe } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const sql = neon(process.env.DATABASE_URL!)

interface Author {
  id: number
  name: string
  email: string
  bio?: string
  profile_picture?: string
  social_links?: Record<string, string>
  created_at: string
}

interface Post {
  id: number
  title: string
  slug: string
  excerpt?: string
  featured_image?: string
  published_at: string
  view_count: number
  like_count: number
  category: { id: number; name: string; slug: string } | null
  tags: Array<{ id: number; name: string; slug: string }>
}

async function getAuthor(id: string): Promise<Author | null> {
  try {
    const authors = await sql`
      SELECT id, name, email, bio, profile_picture, social_links, created_at
      FROM users 
      WHERE id = ${id} AND role IN ('author', 'admin')
    `
    return authors[0] || null
  } catch (error) {
    console.error("Error fetching author:", error)
    return null
  }
}

async function getAuthorPosts(authorId: string): Promise<Post[]> {
  try {
    const posts = await sql`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at, 
        p.view_count, p.like_count,
        c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.author_id = ${authorId} AND p.status = 'published'
      ORDER BY p.published_at DESC
    `

    // Get tags for each post
    const postsWithTags = await Promise.all(
      posts.map(async (post) => {
        const tags = await sql`
          SELECT t.id, t.name, t.slug
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ${post.id}
        `

        return {
          ...post,
          category: post.category_id
            ? { id: post.category_id, name: post.category_name, slug: post.category_slug }
            : null,
          tags,
        }
      }),
    )

    return postsWithTags
  } catch (error) {
    console.error("Error fetching author posts:", error)
    return []
  }
}

async function getAuthorStats(authorId: string) {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_posts,
        COALESCE(SUM(view_count), 0) as total_views,
        COALESCE(SUM(like_count), 0) as total_likes
      FROM posts 
      WHERE author_id = ${authorId} AND status = 'published'
    `
    return stats[0] || { total_posts: 0, total_views: 0, total_likes: 0 }
  } catch (error) {
    console.error("Error fetching author stats:", error)
    return { total_posts: 0, total_views: 0, total_likes: 0 }
  }
}

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const author = await getAuthor(params.id)

  if (!author) {
    notFound()
  }

  const [posts, stats] = await Promise.all([getAuthorPosts(params.id), getAuthorStats(params.id)])

  const socialLinks = author.social_links || {}

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Author Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {author.profile_picture ? (
                  <Image
                    src={author.profile_picture || "/placeholder.svg"}
                    alt={author.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{author.name}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined{" "}
                  {new Date(author.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
              </div>

              {author.bio && <p className="text-gray-700 mb-4 leading-relaxed">{author.bio}</p>}

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <Button key={platform} variant="outline" size="sm" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        {platform === "website" && <Globe className="w-4 h-4" />}
                        {platform === "twitter" && <LinkIcon className="w-4 h-4" />}
                        {platform === "linkedin" && <LinkIcon className="w-4 h-4" />}
                        {platform === "github" && <LinkIcon className="w-4 h-4" />}
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </a>
                    </Button>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.total_posts}</div>
                  <div className="text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.total_views.toLocaleString()}</div>
                  <div className="text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{stats.total_likes.toLocaleString()}</div>
                  <div className="text-gray-600">Likes</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Published Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No published posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative bg-gray-200">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      {post.category && (
                        <Link href={`/category/${post.category.slug}`}>
                          <Badge variant="secondary" className="mb-2">
                            {post.category.name}
                          </Badge>
                        </Link>
                      )}
                    </div>

                    <h3 className="font-semibold mb-2 line-clamp-2">
                      <Link href={`/posts/${post.slug}`} className="hover:text-blue-600">
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Link key={tag.id} href={`/tag/${tag.slug}`}>
                          <Badge variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                      <div className="flex gap-3">
                        <span>{post.view_count} views</span>
                        <span>{post.like_count} likes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const author = await getAuthor(params.id)

  if (!author) {
    return {
      title: "Author Not Found",
    }
  }

  return {
    title: `${author.name} - Author Profile`,
    description: author.bio || `View all posts by ${author.name}`,
  }
}
