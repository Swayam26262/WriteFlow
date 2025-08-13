"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { ProfileImageUpload } from "@/components/profile-image-upload"

export default function BecomeAuthorPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    bio: "",
    profile_picture: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "reader") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "reader") {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "author",
          bio: formData.bio,
          profile_picture: formData.profile_picture,
          social_links: {
            website: formData.website || undefined,
            twitter: formData.twitter || undefined,
            linkedin: formData.linkedin || undefined,
            github: formData.github || undefined,
          },
        }),
      })

      if (response.ok) {
        await refreshUser() // Refresh user data to get updated role
        setSuccess("Congratulations! You are now an author. Redirecting to your dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to upgrade to author")
      }
    } catch (error) {
      setError("Failed to upgrade to author")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      profile_picture: url,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Become an Author</CardTitle>
            <CardDescription>
              Share your stories with the world! Fill out the information below to upgrade your account to an author.
            </CardDescription>
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
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself and what you write about..."
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be displayed on your author profile and posts.
                </p>
              </div>

              <div>
                <Label>Profile Picture</Label>
                <div className="mt-2">
                  <ProfileImageUpload
                    onImageUpload={handleImageUpload}
                    currentImage={formData.profile_picture}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a profile picture to make your author profile more personal.
                </p>
              </div>

              <div className="space-y-4">
                <Label>Social Links (Optional)</Label>
                <p className="text-sm text-gray-500">
                  Add your social media links to help readers connect with you.
                </p>

                <div>
                  <Label htmlFor="website" className="text-sm">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
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
                    value={formData.twitter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, twitter: e.target.value }))}
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
                    value={formData.linkedin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
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
                    value={formData.github}
                    onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your account will be upgraded to author status</li>
                  <li>• You'll get access to the author dashboard</li>
                  <li>• You can start creating and publishing posts</li>
                  <li>• Your posts will be visible to all readers</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Upgrading..." : "Become an Author"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
