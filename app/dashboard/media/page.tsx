"use client"

import { useAuth } from "@/contexts/auth-context"
import { MediaGallery } from "@/components/media-gallery"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MediaPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to access media.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaGallery />
        </CardContent>
      </Card>
    </div>
  )
}
