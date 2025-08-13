import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary environment variables are set
    if (!process.env.CLOUDINARY_URL) {
      console.error("CLOUDINARY_URL environment variable not configured")
      return NextResponse.json({ error: "Upload service not configured" }, { status: 500 })
    }

    // Parse Cloudinary URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const cloudinaryUrl = process.env.CLOUDINARY_URL
    const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/)
    
    if (!urlMatch) {
      console.error("Invalid CLOUDINARY_URL format")
      return NextResponse.json({ error: "Invalid Cloudinary configuration" }, { status: 500 })
    }

    const [, apiKey, apiSecret, cloudName] = urlMatch

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary using signed upload
    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    
    const timestamp = Math.round(new Date().getTime() / 1000)
    const params = {
      timestamp,
      folder: "blog-platform"
    }
    
    // Create signature for signed upload
    const signature = createSignature(params, apiSecret)
    
    const uploadFormData = new FormData()
    uploadFormData.append("file", dataURI)
    uploadFormData.append("api_key", apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("folder", "blog-platform")

    console.log("Uploading to Cloudinary...")
    const cloudinaryResponse = await fetch(cloudinaryUploadUrl, {
      method: "POST",
      body: uploadFormData,
    })

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.text()
      console.error("Cloudinary upload error:", errorData)
      return NextResponse.json({ error: "Upload to Cloudinary failed" }, { status: 500 })
    }

    const cloudinaryData = await cloudinaryResponse.json()
    console.log("Upload successful:", cloudinaryData.secure_url)

    return NextResponse.json({
      url: cloudinaryData.secure_url,
      filename: file.name,
      size: file.size,
      type: file.type,
      public_id: cloudinaryData.public_id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// Helper function to create Cloudinary signature
function createSignature(params: Record<string, any>, apiSecret: string): string {
  const crypto = require('crypto')
  
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result: Record<string, any>, key) => {
      result[key] = params[key]
      return result
    }, {})

  // Create query string
  const queryString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  // Create signature
  const signature = crypto
    .createHash('sha1')
    .update(queryString + apiSecret)
    .digest('hex')

  return signature
}
