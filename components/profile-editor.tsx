"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { ImageUpload } from "./image-upload"

interface ProfileData {
  name: string
  bio: string
  profile_picture: string
  social_links: {
    website?: string
    twitter?: string
    linkedin?: string
    github?: string
  }
}

export function ProfileEditor() {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    bio: "",
    profile_picture: "",
    social_links: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        profile_picture: user.profile_picture || "",
        social_links: user.social_links || {},
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess("Profile updated successfully!")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      setError("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value || undefined,
      },
    }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      profile_picture: url,
    }))
  }

  if (!user) {
    return <div>Please log in to edit your profile.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div>
            <Label>Profile Picture</Label>
            <div className="mt-2">
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.profile_picture}
                className="w-32 h-32 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Social Links</Label>

            <div>
              <Label htmlFor="website" className="text-sm">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.social_links.website || ""}
                onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <Label htmlFor="twitter" className="text-sm">
                Twitter
              </Label>
              <Input
                id="twitter"
                type="url"
                value={formData.social_links.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                placeholder="https://twitter.com/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-sm">
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.social_links.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="github" className="text-sm">
                GitHub
              </Label>
              <Input
                id="github"
                type="url"
                value={formData.social_links.github || ""}
                onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
