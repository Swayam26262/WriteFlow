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
import { Mail, Shield, CheckCircle, Clock } from "lucide-react"

export default function BecomeAuthorPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<"form" | "otp" | "success">("form")
  const [formData, setFormData] = useState({
    bio: "",
    profile_picture: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
  })
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Authorization check
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== "reader") {
      router.push("/dashboard")
    }
  }, [user, router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Show loading or redirect if not authorized
  if (!user || user.role !== "reader") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // First, send OTP to user's email
      const otpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          purpose: "author_verification"
        }),
      })

      if (otpResponse.ok) {
        setOtpSent(true)
        setStep("otp")
        setCountdown(60) // 60 seconds countdown
        setSuccess("OTP sent to your email. Please check your inbox.")
      } else {
        const data = await otpResponse.json()
        setError(data.error || "Failed to send OTP")
      }
    } catch (error) {
      setError("Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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
          otp: otp
        }),
      })

      if (response.ok) {
        await refreshUser() // Refresh user data to get updated role
        setStep("success")
        setSuccess("Congratulations! Your email has been verified and you are now an author.")
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Invalid OTP or failed to upgrade to author")
      }
    } catch (error) {
      setError("Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          purpose: "author_verification"
        }),
      })

      if (response.ok) {
        setCountdown(60)
        setSuccess("OTP resent to your email.")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to resend OTP")
      }
    } catch (error) {
      setError("Failed to resend OTP")
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
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {step === "form" && <Shield className="h-6 w-6 text-blue-600" />}
              {step === "otp" && <Mail className="h-6 w-6 text-blue-600" />}
              {step === "success" && <CheckCircle className="h-6 w-6 text-green-600" />}
              Become an Author
            </CardTitle>
            <CardDescription>
              {step === "form" && "Share your stories with the world! Fill out the information below to upgrade your account to an author."}
              {step === "otp" && "Please verify your email address to complete the author upgrade process."}
              {step === "success" && "Congratulations! Your email has been verified and you are now an author."}
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

            {step === "form" && (
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
                {loading ? "Sending OTP..." : "Send Verification Code"}
              </Button>
            </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center">
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <Mail className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900 mb-2">Email Verification Required</h3>
                    <p className="text-blue-800 text-sm">
                      We've sent a 6-digit verification code to <strong>{user?.email}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="otp">Verification Code *</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="flex-1"
                  >
                    {countdown > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || otp.length !== 6}>
                    {loading ? "Verifying..." : "Verify & Upgrade"}
                  </Button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="text-center space-y-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Email Verified Successfully!</h3>
                  <p className="text-green-800">
                    Your email has been verified and your account has been upgraded to author status.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You now have access to the author dashboard</li>
                    <li>• You can create and publish posts</li>
                    <li>• Your posts will be visible to all readers</li>
                    <li>• You can manage your author profile</li>
                  </ul>
                </div>

                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
