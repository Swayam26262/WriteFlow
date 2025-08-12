import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import { ProfileEditor } from "@/components/profile-editor"

export default async function ProfilePage() {
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
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <ProfileEditor />
    </div>
  )
}
