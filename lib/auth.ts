import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-key-for-development-only-not-secure"
  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET environment variable not set. Using fallback secret for development.")
  }
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET)
  return secret
}

export interface User {
  id: number
  email: string
  name: string
  bio?: string
  profile_picture?: string
  social_links?: Record<string, string>
  role: "admin" | "author" | "reader"
  is_verified: boolean
  created_at: string
}

export interface AuthUser extends User {
  token: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: number): string {
  try {
    const secret = getJWTSecret()
    return jwt.sign({ userId }, secret, { expiresIn: "7d" })
  } catch (error) {
    console.error("JWT generation error:", error)
    throw new Error("Failed to generate token")
  }
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const secret = getJWTSecret()
    const decoded = jwt.verify(token, secret) as { userId: number }
    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, email, name, bio, profile_picture, social_links, role, is_verified, created_at
      FROM users 
      WHERE id = ${id}
    `
    return users[0] || null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  try {
    const users = await sql`
      SELECT id, email, name, bio, profile_picture, social_links, role, is_verified, created_at, password_hash
      FROM users 
      WHERE email = ${email}
    `
    return users[0] || null
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  name: string
  role?: "admin" | "author" | "reader"
}): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password)
    const users = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${userData.email}, ${hashedPassword}, ${userData.name}, ${userData.role || "reader"})
      RETURNING id, email, name, bio, profile_picture, social_links, role, is_verified, created_at
    `
    return users[0] || null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}
