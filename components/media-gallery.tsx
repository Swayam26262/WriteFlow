"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Copy, Eye } from "lucide-react"
import { ImageUpload } from "./image-upload"
import Image from "next/image"

interface MediaItem {
  id: string
  filename: string
  original_name: string
  url: string
  size: number
  type: string
  created_at: string
}

interface MediaGalleryProps {
  onSelect?: (url: string) => void
  selectable?: boolean
}

export function MediaGallery({ onSelect, selectable = false }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchMedia = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media)
      }
    } catch (error) {
      console.error("Error fetching media:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUpload = (url: string) => {
    fetchMedia() // Refresh the gallery
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setMedia(media.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Error deleting media:", error)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return <div className="text-center py-8">Loading media...</div>
  }

  return (
    <div className="space-y-6">
      <ImageUpload onUpload={handleUpload} multiple />

      {media.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No images uploaded yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image src={item.url || "/placeholder.svg"} alt={item.original_name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedImage(item.url)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => copyToClipboard(item.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {selectable && onSelect && (
                        <Button size="sm" variant="default" onClick={() => onSelect(item.url)}>
                          Select
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{item.original_name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video">
              <Image src={selectedImage || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
