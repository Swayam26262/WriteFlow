"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Copy, Check } from "lucide-react"

interface ImageFile {
  url: string
  filename: string
  size: number
  uploadedAt: string
}

interface ImageGalleryProps {
  onImageSelect?: (url: string) => void
  showActions?: boolean
}

export function ImageGallery({ onImageSelect, showActions = true }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images")
      if (response.ok) {
        const data = await response.json()
        setImages(data.images)
      }
    } catch (error) {
      console.error("Failed to fetch images:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (url: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      const response = await fetch("/api/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (response.ok) {
        setImages(images.filter((img) => img.url !== url))
      }
    } catch (error) {
      console.error("Failed to delete image:", error)
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>
  }

  if (images.length === 0) {
    return <div className="text-center py-8 text-gray-500">No images uploaded yet</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card key={image.url} className="overflow-hidden">
          <div className="aspect-square relative">
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.filename}
              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onImageSelect?.(image.url)}
            />
          </div>
          {showActions && (
            <div className="p-2 space-y-2">
              <p className="text-xs text-gray-600 truncate" title={image.filename}>
                {image.filename}
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => copyUrl(image.url)} className="flex-1">
                  {copiedUrl === image.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteImage(image.url)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
