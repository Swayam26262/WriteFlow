import { NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json({ 
        error: "CLOUDINARY_URL not configured",
        status: "failed"
      })
    }

    // Parse Cloudinary URL
    const cloudinaryUrl = process.env.CLOUDINARY_URL
    const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/)
    
    if (!urlMatch) {
      return NextResponse.json({ 
        error: "Invalid CLOUDINARY_URL format",
        status: "failed"
      })
    }

    const [, apiKey, apiSecret, cloudName] = urlMatch

    return NextResponse.json({
      status: "success",
      cloudName,
      apiKey: apiKey.substring(0, 8) + "...", // Only show first 8 chars for security
      hasApiSecret: !!apiSecret,
      message: "Cloudinary configuration is valid"
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to parse Cloudinary configuration",
      status: "failed"
    })
  }
}
