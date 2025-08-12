"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus } from "lucide-react"

interface Tag {
  id: number
  name: string
  slug: string
  post_count: number
  created_at: string
}

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tagName, setTagName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!tagName.trim()) {
      setError("Tag name is required")
      return
    }

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName.trim() }),
      })

      if (response.ok) {
        setSuccess("Tag created successfully")
        setTagName("")
        setShowForm(false)
        fetchTags()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create tag")
      }
    } catch (error) {
      setError("Failed to create tag")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return

    try {
      const response = await fetch(`/api/tags/${id}`, { method: "DELETE" })
      if (response.ok) {
        setSuccess("Tag deleted successfully")
        fetchTags()
      } else {
        setError("Failed to delete tag")
      }
    } catch (error) {
      setError("Failed to delete tag")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading tags...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tags</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tag Name *</Label>
                <Input
                  id="name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Tag</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
            <span className="text-sm">{tag.name}</span>
            <Badge variant="secondary" className="text-xs">
              {tag.post_count}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(tag.id)}
              className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {tags.length === 0 && <div className="text-center py-8 text-gray-500">No tags created yet</div>}
    </div>
  )
}
