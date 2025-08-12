import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import { UserManagement } from "@/components/user-management"

export default async function AdminUsersPage() {
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">Manage all platform users</p>
      </div>
      <UserManagement />
    </div>
  )
}
