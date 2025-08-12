import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return authMiddleware(request)
  }

  // Protect author routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    return authMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
}
