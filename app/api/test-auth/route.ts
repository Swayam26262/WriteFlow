import { NextResponse } from "next/server"
import { verifyToken, getUserById } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(/auth-token=([^;]+)/)?.[1]
    
    console.log("Testing authentication...")
    console.log("Token exists:", !!token)
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: "No token found",
        message: "Please log in first"
      })
    }
    
    const payload = verifyToken(token)
    console.log("Token payload:", payload)
    
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid token",
        message: "Token verification failed"
      })
    }
    
    const user = await getUserById(payload.userId)
    console.log("User found:", user)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found",
        message: "User does not exist"
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: "Authentication successful"
    })
  } catch (error) {
    console.error("Auth test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
