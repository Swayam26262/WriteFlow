"use client"

import { useState } from "react"
import { Mail, Heart } from "lucide-react"

export function Footer() {
  const [email, setEmail] = useState("")
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState("")

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setSubscribeMessage("Please enter a valid email address")
      return
    }

    setSubscribeLoading(true)
    setSubscribeMessage("")

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribeMessage("Successfully subscribed! Check your email for confirmation.")
        setEmail("")
      } else {
        setSubscribeMessage(data.error || "Failed to subscribe. Please try again.")
      }
    } catch (error) {
      setSubscribeMessage("Something went wrong. Please try again.")
    } finally {
      setSubscribeLoading(false)
    }
  }
  return (
    <footer className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border-t border-blue-200">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Signup */}
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Stay Updated</h4>
          <p className="text-gray-600 mb-4">Get the latest stories and writing tips delivered to your inbox.</p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              onClick={handleSubscribe}
              disabled={subscribeLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {subscribeLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </button>
          </div>
          {subscribeMessage && (
            <p className={`mt-4 text-sm ${subscribeMessage.includes("Successfully") ? "text-green-600" : "text-red-600"}`}>
              {subscribeMessage}
            </p>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-blue-200 text-center">
          <p className="text-gray-600">
            © 2025 WriteFlow. Made with <Heart className="inline h-4 w-4 text-red-500" /> for writers everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}
