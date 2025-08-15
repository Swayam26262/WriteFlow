import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  status: "draft" | "published" | "archived"
  author_id: number
  category_id?: number
  view_count: number
  like_count: number
  meta_title?: string
  meta_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  author?: {
    id: number
    name: string
    email: string
    profile_picture?: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
  tags?: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface CreatePostData {
  title: string
  content: string
  excerpt?: string
  featured_image?: string
  status?: "draft" | "published" | "archived"
  category_id?: number
  meta_title?: string
  meta_description?: string
  tag_ids?: number[]
  slug?: string
  published_at?: string | null
}

export interface SearchPostsParams {
  query?: string
  category?: string
  tag?: string
  page?: number
  limit?: number
}

export interface SearchPostsResult {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function createPost(authorId: number, postData: CreatePostData): Promise<Post | null> {
  try {
    console.log("createPost called with:", { authorId, postData: { ...postData, content: postData.content?.substring(0, 100) + "..." } })
    
    const slug = (postData.slug && postData.slug.trim()) ? postData.slug.trim() : generateSlug(postData.title)
    const publishedAt = postData.status === "published" ? (postData.published_at || new Date().toISOString()) : null

    console.log("Generated slug:", slug)
    console.log("Published at:", publishedAt)

    const posts = await sql`
      INSERT INTO posts (
        title, slug, content, excerpt, featured_image, status, 
        author_id, category_id, meta_title, meta_description, published_at
      )
      VALUES (
        ${postData.title}, ${slug}, ${postData.content}, ${postData.excerpt || null},
        ${postData.featured_image || null}, ${postData.status || "draft"},
        ${authorId}, ${postData.category_id || null}, ${postData.meta_title || null},
        ${postData.meta_description || null}, ${publishedAt}
      )
      RETURNING *
    `

    console.log("SQL insert result:", posts)

    const post = posts[0]
    if (!post) {
      console.error("No post returned from database insert")
      return null
    }

    // Add tags if provided
    if (postData.tag_ids && postData.tag_ids.length > 0) {
      console.log("Adding tags:", postData.tag_ids)
      for (const tagId of postData.tag_ids) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${post.id}, ${tagId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    console.log("Post created successfully:", post.id)
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image,
      status: post.status,
      author_id: post.author_id,
      category_id: post.category_id,
      view_count: post.view_count,
      like_count: post.like_count,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.author_id,
        name: '',
        email: '',
        profile_picture: undefined,
      },
      category: undefined,
      tags: [],
    }
  } catch (error) {
    console.error("Error creating post:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return null
  }
}

export async function updatePost(
  postId: number,
  authorId: number,
  postData: Partial<CreatePostData>,
): Promise<Post | null> {
  try {
    // Check if post exists and user is the author
    const existingPost = await sql`
      SELECT id, author_id FROM posts WHERE id = ${postId}
    `
    
    if (existingPost.length === 0) {
      return null
    }
    
    if (existingPost[0].author_id !== authorId) {
      return null
    }

    // Build update data
    const updateData: any = {}
    
    if (postData.title !== undefined) {
      updateData.title = postData.title
      if (!postData.slug) {
        updateData.slug = generateSlug(postData.title)
      }
    }
    
    if (postData.slug !== undefined) {
      updateData.slug = postData.slug?.trim() || null
    }
    
    if (postData.content !== undefined) {
      updateData.content = postData.content
    }
    
    if (postData.excerpt !== undefined) {
      updateData.excerpt = postData.excerpt
    }
    
    if (postData.featured_image !== undefined) {
      updateData.featured_image = postData.featured_image
    }
    
    if (postData.status !== undefined) {
      updateData.status = postData.status
      if (postData.status === "published") {
        updateData.published_at = postData.published_at || new Date().toISOString()
      }
    }
    
    if (postData.published_at !== undefined) {
      updateData.published_at = postData.published_at
    }
    
    if (postData.category_id !== undefined) {
      updateData.category_id = postData.category_id
    }
    
    if (postData.meta_title !== undefined) {
      updateData.meta_title = postData.meta_title
    }
    
    if (postData.meta_description !== undefined) {
      updateData.meta_description = postData.meta_description
    }
    
    updateData.updated_at = new Date().toISOString()

    // Execute update with all fields
    const result = await sql`
      UPDATE posts 
      SET 
        title = COALESCE(${updateData.title}, title),
        slug = COALESCE(${updateData.slug}, slug),
        content = COALESCE(${updateData.content}, content),
        excerpt = COALESCE(${updateData.excerpt}, excerpt),
        featured_image = COALESCE(${updateData.featured_image}, featured_image),
        status = COALESCE(${updateData.status}, status),
        published_at = COALESCE(${updateData.published_at}, published_at),
        category_id = COALESCE(${updateData.category_id}, category_id),
        meta_title = COALESCE(${updateData.meta_title}, meta_title),
        meta_description = COALESCE(${updateData.meta_description}, meta_description),
        updated_at = ${updateData.updated_at}
      WHERE id = ${postId}
      RETURNING *
    `
    
    const updatedPost = result[0]
    if (!updatedPost) return null

    // Handle tag updates if provided
    if (postData.tag_ids !== undefined) {
      console.log("Updating tags for post:", postId, "New tag IDs:", postData.tag_ids)
      
      // Remove all existing tags for this post
      await sql`
        DELETE FROM post_tags WHERE post_id = ${postId}
      `
      
      // Add new tags if any
      if (postData.tag_ids.length > 0) {
        for (const tagId of postData.tag_ids) {
          await sql`
            INSERT INTO post_tags (post_id, tag_id)
            VALUES (${postId}, ${tagId})
            ON CONFLICT DO NOTHING
          `
        }
      }
    }

    // Fetch the updated post with tags
    return await getPostById(postId)
  } catch (error) {
    console.error("Error updating post:", error)
    return null
  }
}

export async function getPostsByAuthor(authorId: number, status?: string): Promise<Post[]> {
  try {
    const posts = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.author_id = ${authorId}
      ${status ? sql`AND p.status = ${status}` : sql``}
      ORDER BY p.created_at DESC
    `

    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image,
      status: post.status,
      author_id: post.author_id,
      category_id: post.category_id,
      view_count: post.view_count,
      like_count: post.like_count,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.author_id,
        name: post.author_name || '',
        email: '',
        profile_picture: undefined,
      },
      category: post.category_name
        ? {
            id: post.category_id,
            name: post.category_name,
            slug: post.category_slug,
          }
        : undefined,
      tags: [],
    }))
  } catch (error) {
    console.error("Error fetching posts by author:", error)
    return []
  }
}

export async function getPostById(id: number): Promise<Post | null> {
  try {
    const posts = await sql`
      SELECT p.*, u.name as author_name, u.email as author_email,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `

    const post = posts[0]
    if (!post) return null

    // Get tags
    const tags = await sql`
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ${id}
    `

    return {
      ...post,
      author: {
        id: post.author_id,
        name: post.author_name,
        email: post.author_email,
      },
      category: post.category_name
        ? {
            id: post.category_id,
            name: post.category_name,
            slug: post.category_slug,
          }
        : undefined,
      tags,
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const posts = await sql`
      SELECT p.*, u.name as author_name, u.email as author_email, u.profile_picture as author_profile_picture,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${slug} AND p.status = 'published' AND (p.published_at IS NULL OR p.published_at <= NOW())
      LIMIT 1
    `

    const post = posts[0]
    if (!post) return null

    const tags = await sql`
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ${post.id}
    `

    return {
      ...post,
      author: {
        id: post.author_id,
        name: post.author_name,
        email: post.author_email,
        profile_picture: post.author_profile_picture,
      },
      category: post.category_name
        ? {
            id: post.category_id,
            name: post.category_name,
            slug: post.category_slug,
          }
        : undefined,
      tags,
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error)
    return null
  }
}

export async function deletePost(postId: number, authorId: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM posts 
      WHERE id = ${postId} AND author_id = ${authorId}
    `
    return result.count > 0
  } catch (error) {
    console.error("Error deleting post:", error)
    return false
  }
}

export async function getCategories() {
  try {
    return await sql`
      SELECT * FROM categories 
      ORDER BY name ASC
    `
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getTags() {
  try {
    return await sql`
      SELECT * FROM tags 
      ORDER BY name ASC
    `
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

export async function searchPosts(params: SearchPostsParams): Promise<SearchPostsResult> {
  try {
    const { query = "", category = "", tag = "", page = 1, limit = 12 } = params
    const offset = (page - 1) * limit

    // Build the WHERE clause
    const whereConditions = ["p.status = 'published'", "(p.published_at IS NULL OR p.published_at <= NOW())"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (query) {
      whereConditions.push(
        `(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex} OR p.excerpt ILIKE $${paramIndex})`,
      )
      queryParams.push(`%${query}%`)
      paramIndex++
    }

    if (category && category !== "all") {
      whereConditions.push(`c.slug = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (tag && tag !== "all") {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM post_tags pt 
        JOIN tags t ON pt.tag_id = t.id 
        WHERE pt.post_id = p.id AND t.slug = $${paramIndex}
      )`)
      queryParams.push(tag)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `
    const countResult = await sql.unsafe(countQuery, queryParams)
    const total = Number.parseInt(countResult[0].total)

    // Get posts
    const postsQuery = `
      SELECT DISTINCT p.*, 
             u.name as author_name, u.email as author_email,
             c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const posts = await sql.unsafe(postsQuery, queryParams)

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
          author: {
            id: post.author_id,
            name: post.author_name,
            email: post.author_email,
          },
          category: post.category_id
            ? {
                id: post.category_id,
                name: post.category_name,
                slug: post.category_slug,
              }
            : null,
          tags,
        }
      }),
    )

    return {
      posts: postsWithTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Error searching posts:", error)
    return {
      posts: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
    }
  }
}
