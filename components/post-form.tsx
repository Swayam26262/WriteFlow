"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { ImageUpload } from "./image-upload"
import { RichTextEditor } from "./rich-text-editor"
import type { Post } from "@/lib/posts"

interface PostFormProps {
  post?: Post
  onSubmit: (data: PostFormData) => Promise<void>
  loading?: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt: string
  featured_image: string
  status: "draft" | "published"
  category_id: number | null
  meta_title: string
  meta_description: string
  tag_ids: number[]
  slug?: string
  published_at?: string | null
}

export function PostForm({ post, onSubmit, loading }: PostFormProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: post?.title || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    featured_image: post?.featured_image || "",
    status: post?.status || "draft",
    category_id: post?.category_id || null,
    meta_title: post?.meta_title || "",
    meta_description: post?.meta_description || "",
    tag_ids: post?.tags?.map((tag) => tag.id) || [],
    slug: post?.slug,
    published_at: post?.published_at || null,
  })

  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])
  const [error, setError] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [creatingTag, setCreatingTag] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [versionHistory, setVersionHistory] = useState<Array<{ ts: number; data: PostFormData }>>([])
  const [categoryFilter, setCategoryFilter] = useState("")

  const seoInfo = useMemo(() => {
    const title = formData.meta_title?.trim() || formData.title?.trim()
    const description = formData.meta_description?.trim() || formData.excerpt?.trim() || ""
    const contentText = formData.content.replace(/<[^>]*>/g, " ")
    const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length
    const sentenceCount = contentText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1
    const avgSentenceLength = wordCount / sentenceCount
    const flesch = (() => {
      // Naive syllable estimate and Flesch Reading Ease
      const syllables = contentText.toLowerCase().split(/[^a-z]+/).reduce((sum, w) => {
        if (!w) return sum
        const m = w.match(/[aeiouy]+/g)
        return sum + (m ? m.length : 1)
      }, 0)
      const words = Math.max(wordCount, 1)
      const sentences = Math.max(sentenceCount, 1)
      return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    })()
    const titleLength = title?.length || 0
    const descLength = description?.length || 0
    const suggestions: string[] = []
    if (titleLength < 30 || titleLength > 60) suggestions.push("Meta title length should be 30–60 characters")
    if (descLength < 70 || descLength > 160) suggestions.push("Meta description length should be 70–160 characters")
    if (avgSentenceLength > 25) suggestions.push("Average sentence length is high; consider shorter sentences")
    if (wordCount < 300) suggestions.push("Content is short; aim for 300+ words")
    return { wordCount, flesch: Math.round(flesch), suggestions, titleLength, descLength }
  }, [formData])

  const filteredCategories = useMemo(() => {
    if (!categoryFilter.trim()) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(categoryFilter.toLowerCase()))
  }, [categories, categoryFilter])

  const markdownToHtml = (md: string) => {
    // Minimal markdown to HTML conversion
    let out = md
    out = out.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre><code>${p1.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`) // code blocks
    out = out.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
    out = out.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
    out = out.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
    out = out.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    out = out.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    out = out.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>')
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
    out = out.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    out = out.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
    // paragraphs
    out = out
      .split(/\n{2,}/)
      .map((para) => (para.match(/^<h[1-6]|^<pre|^<ul|^<ol|^<img|^<blockquote/) ? para : `<p>${para.replace(/\n/g, '<br/>')}</p>`))
      .join('\n')
    return out
  }

  useEffect(() => {
    fetchCategoriesAndTags()
  }, [])

  // Autosave to localStorage every 10s and keep version history (last 10)
  useEffect(() => {
    const key = post ? `post:${post.id}:draft` : `post:new:draft`
    const interval = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(formData))
        setVersionHistory((prev) => {
          const next = [...prev, { ts: Date.now(), data: formData }]
          return next.slice(-10)
        })
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [formData, post])

  // Restore from localStorage if exists
  useEffect(() => {
    try {
      const key = post ? `post:${post.id}:draft` : `post:new:draft`
      const raw = localStorage.getItem(key)
      if (raw) {
        const saved = JSON.parse(raw)
        setFormData((prev) => ({ ...prev, ...saved }))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([fetch("/api/categories"), fetch("/api/tags")])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }
    } catch (error) {
      console.error("Error fetching categories and tags:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title.trim()) {
      setError("Title is required")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    try {
      const contentForSubmit = showMarkdown ? markdownToHtml(formData.content) : formData.content
      await onSubmit({ ...formData, content: contentForSubmit })
    } catch (error) {
      console.error("PostForm error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save post"
      setError(errorMessage)
    }
  }

  const restoreVersion = (ts: number) => {
    const v = versionHistory.find((v) => v.ts === ts)
    if (v) setFormData(v.data)
  }

  const handleTagToggle = (tagId: number) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId) ? prev.tag_ids.filter((id) => id !== tagId) : [...prev.tag_ids, tagId],
    }))
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    setCreatingTag(true)
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const tag = await response.json()
        setTags((prev) => [...prev, { id: tag.id, name: tag.name }])
        setFormData((prev) => ({ ...prev, tag_ids: [...prev.tag_ids, tag.id] }))
        setNewTagName("")
      }
    } catch (error) {
      console.error("Failed to create tag", error)
    } finally {
      setCreatingTag(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Post Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant={showPreview ? "default" : "outline"} onClick={() => setShowPreview((s) => !s)}>
                    {showPreview ? "Editing" : "Preview"}
                  </Button>
                  <Button type="button" variant={showMarkdown ? "default" : "outline"} onClick={() => setShowMarkdown((s) => !s)}>
                    {showMarkdown ? "Rich Text" : "Markdown"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                {showPreview ? (
                  <div
                    className="prose max-w-none border rounded-md p-4"
                    dangerouslySetInnerHTML={{ __html: showMarkdown ? markdownToHtml(formData.content) : formData.content }}
                  />
                ) : showMarkdown ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files?.[0]
                      if (!file) return
                      const body = new FormData()
                      body.append("file", file)
                      const res = await fetch("/api/media/upload", { method: "POST", body })
                      if (res.ok) {
                        const { url } = await res.json()
                        setFormData((prev) => ({ ...prev, content: `${prev.content}\n\n![](${url})` }))
                      }
                    }}
                  >
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write Markdown... (drag & drop images to upload)"
                      rows={20}
                    />
                  </div>
                ) : (
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                    placeholder="Write your post content..."
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of your post"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (leave empty to use post title)"
                />
                <div className="text-xs text-muted-foreground">Characters: {(formData.meta_title || formData.title).length}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description"
                  rows={2}
                />
                <div className="text-xs text-muted-foreground">Characters: {formData.meta_description.length}</div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Words: {seoInfo.wordCount} • Flesch: {seoInfo.flesch}</div>
                {seoInfo.suggestions.length > 0 && (
                  <ul className="list-disc pl-5">
                    {seoInfo.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Templates</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => setFormData((prev) => ({
                    ...prev,
                    title: prev.title || "How to ...: A Step-by-Step Guide",
                    content: prev.content || (showMarkdown ? `# Introduction\n\n- Prerequisites\n- Steps\n\n## Steps\n1. ...\n2. ...\n\n## Conclusion` : `<h1>Introduction</h1><ul><li>Prerequisites</li><li>Steps</li></ul><h2>Steps</h2><ol><li>...</li><li>...</li></ol><h2>Conclusion</h2>`),
                    excerpt: prev.excerpt || "A practical guide to ...",
                  }))}>Guide</Button>
                  <Button type="button" variant="outline" onClick={() => setFormData((prev) => ({
                    ...prev,
                    title: prev.title || "Product Review: ...",
                    content: prev.content || (showMarkdown ? `# Overview\n\n## Pros\n- ...\n\n## Cons\n- ...\n\n## Verdict` : `<h1>Overview</h1><h2>Pros</h2><ul><li>...</li></ul><h2>Cons</h2><ul><li>...</li></ul><h2>Verdict</h2>`),
                    excerpt: prev.excerpt || "An honest review of ...",
                  }))}>Review</Button>
                  <Button type="button" variant="outline" onClick={() => setFormData((prev) => ({
                    ...prev,
                    title: prev.title || "Tutorial: ...",
                    content: prev.content || (showMarkdown ? `# What you'll build\n\n## Steps\n1. Setup\n2. Implement\n3. Test\n\n## Next steps` : `<h1>What you'll build</h1><h2>Steps</h2><ol><li>Setup</li><li>Implement</li><li>Test</li></ol><h2>Next steps</h2>`),
                    excerpt: prev.excerpt || "Learn how to ...",
                  }))}>Tutorial</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published") => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="published_at">Schedule</Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                />
                <div className="text-xs text-muted-foreground">Set a future date/time to schedule publication.</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filter categories"
                />
                <Select
                  value={formData.category_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category_id: value === "none" ? null : Number.parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Custom Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="custom-url-slug"
                />
                <div className="text-xs text-muted-foreground">Leave blank to auto-generate from title.</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image">Featured Image</Label>
                {formData.featured_image && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <Image src={formData.featured_image || "/placeholder.svg"} alt="Featured" fill className="object-cover" />
                  </div>
                )}
                <ImageUpload onUpload={(url) => setFormData((prev) => ({ ...prev, featured_image: url }))} className="mt-2" />
                <div className="text-xs text-muted-foreground">Or paste an image URL below</div>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Create new tag" />
                <Button type="button" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()}>
                  {creatingTag ? "Adding..." : "Add"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.tag_ids.includes(tag.id)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {versionHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">No versions yet. Autosave runs every 10s.</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-auto">
                  {versionHistory
                    .slice()
                    .reverse()
                    .map((v) => (
                      <button
                        key={v.ts}
                        type="button"
                        onClick={() => restoreVersion(v.ts)}
                        className="text-left text-sm border rounded p-2 hover:bg-gray-50"
                      >
                        {new Date(v.ts).toLocaleString()}
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="flex-1"
              onClick={() => {
                const contentForSubmit = showMarkdown ? markdownToHtml(formData.content) : formData.content
                onSubmit({ ...formData, content: contentForSubmit, status: "draft" })
              }}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={loading}
              className="flex-1"
              onClick={() => {
                const contentForSubmit = showMarkdown ? markdownToHtml(formData.content) : formData.content
                onSubmit({ ...formData, content: contentForSubmit, status: "published" })
              }}
            >
              {loading ? "Saving..." : post ? "Publish Changes" : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
