import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, MessageSquare, Eye, TrendingUp } from "lucide-react"

const sql = neon(process.env.DATABASE_URL!)

async function getAdminStats() {
  try {
    const [userStats, postStats, commentStats, engagementStats] = await Promise.all([
      sql`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'author' THEN 1 END) as author_count,
          COUNT(CASE WHEN role = 'reader' THEN 1 END) as reader_count,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
        FROM users
      `,
      sql`
        SELECT 
          COUNT(*) as total_posts,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_posts_30d
        FROM posts
      `,
      sql`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_comments_30d
        FROM comments
      `,
      sql`
        SELECT 
          COALESCE(SUM(view_count), 0) as total_views,
          COALESCE(SUM(like_count), 0) as total_likes
        FROM posts
      `,
    ])

    return {
      users: userStats[0],
      posts: postStats[0],
      comments: commentStats[0],
      engagement: engagementStats[0],
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return {
      users: { total_users: 0, admin_count: 0, author_count: 0, reader_count: 0, new_users_30d: 0 },
      posts: { total_posts: 0, published_posts: 0, draft_posts: 0, new_posts_30d: 0 },
      comments: { total_comments: 0, new_comments_30d: 0 },
      engagement: { total_views: 0, total_likes: 0 },
    }
  }
}

export default async function AdminDashboard() {
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

  const stats = await getAdminStats()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your blogging platform</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total_users}</div>
            <p className="text-xs text-muted-foreground">+{stats.users.new_users_30d} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts.total_posts}</div>
            <p className="text-xs text-muted-foreground">+{stats.posts.new_posts_30d} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments.total_comments}</div>
            <p className="text-xs text-muted-foreground">+{stats.comments.new_comments_30d} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagement.total_views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.engagement.total_likes} total likes</p>
          </CardContent>
        </Card>
      </div>

      {/* User Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Admins</span>
                <span className="font-semibold">{stats.users.admin_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Authors</span>
                <span className="font-semibold">{stats.users.author_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Readers</span>
                <span className="font-semibold">{stats.users.reader_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Published Posts</span>
                <span className="font-semibold">{stats.posts.published_posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Draft Posts</span>
                <span className="font-semibold">{stats.posts.draft_posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Comments</span>
                <span className="font-semibold">{stats.comments.total_comments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage all users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">Manage Posts</h3>
            <p className="text-sm text-gray-600">Review and moderate posts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold mb-1">Manage Comments</h3>
            <p className="text-sm text-gray-600">Moderate comments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-gray-600">View detailed analytics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
