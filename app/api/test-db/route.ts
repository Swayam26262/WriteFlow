import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("Testing database connection...")
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)
    
    // Test a simple query
    const result = await sql`SELECT 1 as test`
    console.log("Database test result:", result)
    
    // Check if posts table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'posts'
    `
    console.log("Posts table exists:", tables.length > 0)
    
    return NextResponse.json({ 
      success: true, 
      test: result[0], 
      postsTableExists: tables.length > 0,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set"
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set"
    }, { status: 500 })
  }
}
