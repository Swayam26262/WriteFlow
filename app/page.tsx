import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to BlogPlatform</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A full-featured multi-user blogging platform where writers can create, publish, and manage their content
            with rich text editing, media uploads, and engaging community features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Rich Content Creation</h3>
              <p className="text-gray-600">
                Create beautiful blog posts with our WYSIWYG editor, supporting formatting, images, and embedded
                content.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">User Engagement</h3>
              <p className="text-gray-600">
                Build your audience with likes, comments, and social sharing. Connect with readers and other authors.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Professional Features</h3>
              <p className="text-gray-600">
                SEO optimization, analytics, categories, tags, and everything you need for professional blogging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
