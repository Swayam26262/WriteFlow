"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"

interface CommentFormProps {
  postId: number
  parentId?: number
  onCommentAdded: (comment: any) => void
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({ postId, parentId, onCommentAdded, onCancel, placeholder }: CommentFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
        }),
      })

      if (response.ok) {
        const newComment = await response.json()
        onCommentAdded(newComment)
        setContent("")
        onCancel?.()
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="text-center py-4 text-muted-foreground">Please log in to leave a comment.</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "Write a comment..."}
        rows={3}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "Posting..." : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
