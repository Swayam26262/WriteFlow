import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Instead, we'll handle authentication in the actual route handlers

  // Protect admin routes - redirect to login if no auth token cookie
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Let the actual route handler verify the token validity
  }

  // Protect dashboard routes - redirect to login if no auth token cookie
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Let the actual route handler verify the token validity
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
}
