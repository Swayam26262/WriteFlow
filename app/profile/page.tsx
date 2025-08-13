"use client"

import { useAuth } from "@/contexts/auth-context"
import { ProfileEditor } from "@/components/profile-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">
          Welcome back, {user.name}! You are currently a {user.role}.
        </p>
      </div>

      {user.role === "reader" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Become an Author</CardTitle>
            <CardDescription>
              Ready to share your stories with the world? Upgrade your account to start publishing posts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/become-author">Become an Author</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <ProfileEditor />
    </div>
  )
}
