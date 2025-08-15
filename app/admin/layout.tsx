import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Users, FileText, MessageSquare, BarChart3, Mail } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const payload = verifyToken(token)
  if (!payload) {
    redirect("/login")
  }

  const user = await getUserById(payload.userId)
  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-white to-purple-50 shadow-lg min-h-screen border-r border-purple-100">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>

          <nav className="mt-6">
            <div className="px-6 space-y-2">
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </Link>

              <Link href="/admin/posts">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <FileText className="h-4 w-4" />
                  Posts
                </Button>
              </Link>

              <Link href="/admin/comments">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </Button>
              </Link>

              <Link href="/admin/analytics">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>

              <Link href="/admin/newsletter">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Mail className="h-4 w-4" />
                  Newsletter
                </Button>
              </Link>
            </div>

            <div className="mt-8 px-6 pt-6 border-t">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
