import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getPostBySlug } from "@/lib/posts"
import { ViewTracker } from "@/components/view-tracker"
import { LikeButton } from "@/components/like-button"
import { CommentsSection } from "@/components/comments-section"
import type { Metadata } from "next"

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
        <ViewTracker postId={post.id} />
        {post.featured_image && (
          <div className="relative aspect-video mb-6">
            <Image src={post.featured_image || "/placeholder.svg"} alt={post.title} fill className="object-cover rounded-md" />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-3">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          {post.author?.profile_picture && (
            <span className="relative h-8 w-8 overflow-hidden rounded-full border">
              <Image src={post.author.profile_picture} alt={post.author.name} fill className="object-cover" />
            </span>
          )}
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

        <div className="mb-6">
          <LikeButton postId={post.id} />
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

        <div className="mt-10">
          <CommentsSection postId={post.id} />
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post not found",
    }
  }

  const fallbackImage = "https://res.cloudinary.com/df2oollzg/image/upload/v1755242339/da7b4e86-33b0-4206-8675-1a799ec5f3f0.png"
  const ogImage = post.featured_image || fallbackImage

  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || post.title,
      url: `/posts/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      images: [ogImage],
    },
  }
}

