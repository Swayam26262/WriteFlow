import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { allura } from "@/lib/fonts"

export const metadata: Metadata = {
  title: "WriteFlow - Multi-User Blogging Platform",
  description: "A full-featured MERN stack blogging platform with rich content creation and user management",
  generator: "v0.dev",
  icons: {
    icon: "https://res.cloudinary.com/df2oollzg/image/upload/v1755095614/Untitled_design_1_avqxrj.svg",
    shortcut: "https://res.cloudinary.com/df2oollzg/image/upload/v1755095614/Untitled_design_1_avqxrj.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-allura: ${allura.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
