import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { allura } from "@/lib/fonts"

export const metadata: Metadata = {
  title: "WriteFlow",
  description: "A full-featured blogging platform with rich content creation and user management",
  generator: "WriteFlow",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: "https://res.cloudinary.com/df2oollzg/image/upload/v1755095614/Untitled_design_1_avqxrj.svg",
    shortcut: "https://res.cloudinary.com/df2oollzg/image/upload/v1755095614/Untitled_design_1_avqxrj.svg",
  },
  openGraph: {
    type: "website",
    siteName: "WriteFlow",
    images: [
      {
        url: "https://res.cloudinary.com/df2oollzg/image/upload/v1755242339/da7b4e86-33b0-4206-8675-1a799ec5f3f0.png",
        width: 1200,
        height: 630,
        alt: "WriteFlow – Blog platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://res.cloudinary.com/df2oollzg/image/upload/v1755242339/da7b4e86-33b0-4206-8675-1a799ec5f3f0.png",
    ],
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
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
