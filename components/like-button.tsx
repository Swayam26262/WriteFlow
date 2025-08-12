"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  postId: number
  className?: string
}

export function LikeButton({ postId, className }: LikeButtonProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLikeStatus()
  }, [postId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.userLiked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error("Error fetching like status:", error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      // Redirect to login or show login modal
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleLike}
      disabled={loading || !user}
      className={cn("gap-2", className)}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      {likeCount}
    </Button>
  )
}
