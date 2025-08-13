import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getPostBySlug } from "@/lib/posts"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {post.featured_image && (
          <div className="relative aspect-video mb-6">
            <Image src={post.featured_image || "/placeholder.svg"} alt={post.title} fill className="object-cover rounded-md" />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-3">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span>By {post.author?.name}</span>
          <span>•</span>
          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}</span>
          {post.category && (
            <>
              <span>•</span>
              <Badge variant="outline">
                <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
              </Badge>
            </>
          )}
        </div>

        <Card className="mb-8">
          <CardContent className="prose dark:prose-invert max-w-none pt-6" dangerouslySetInnerHTML={{ __html: post.content }} />
        </Card>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                <Link href={`/tag/${tag.slug}`}>#{tag.name}</Link>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


