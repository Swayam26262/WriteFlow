"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { CommentForm } from "./comment-form"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface CommentItemProps {
  comment: Comment
  postId: number
  onCommentAdded: (comment: Comment, parentId?: number) => void
  onCommentDeleted: (commentId: number) => void
  depth?: number
}

export function CommentItem({ comment, postId, onCommentAdded, onCommentDeleted, depth = 0 }: CommentItemProps) {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const canEdit = user?.id === comment.author.id
  const canDelete = user?.id === comment.author.id || user?.role === "admin"
  const maxDepth = 3

  const handleReply = (newComment: Comment) => {
    onCommentAdded(newComment, comment.id)
    setShowReplyForm(false)
  }

  const handleEdit = async () => {
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        setEditing(false)
        // You might want to refresh comments here
      }
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onCommentDeleted(comment.id)
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
                {comment.updated_at !== comment.created_at && " (edited)"}
              </span>
            </div>

            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
          )}

          {!editing && depth < maxDepth && (
            <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Reply
            </Button>
          )}

          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentAdded={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${comment.author.name}...`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
