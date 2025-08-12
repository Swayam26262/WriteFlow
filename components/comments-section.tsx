"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"

interface Comment {
  id: number
  content: string
  created_at: string
  updated_at: string
  author: {
    id: number
    name: string
    email: string
  }
  replies: Comment[]
}

interface CommentsSectionProps {
  postId: number
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = (newComment: Comment, parentId?: number) => {
    if (parentId) {
      // Add reply to existing comment
      setComments((prev) => {
        const updateComments = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...comment.replies, newComment],
              }
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateComments(comment.replies),
              }
            }
            return comment
          })
        }
        return updateComments(prev)
      })
    } else {
      // Add new top-level comment
      setComments((prev) => [newComment, ...prev])
    }
  }

  const handleCommentDeleted = (commentId: number) => {
    setComments((prev) => {
      const removeComment = (comments: Comment[]): Comment[] => {
        return comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: removeComment(comment.replies),
          }))
      }
      return removeComment(prev)
    })
  }

  if (loading) {
    return <div className="text-center py-4">Loading comments...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to comment!</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
