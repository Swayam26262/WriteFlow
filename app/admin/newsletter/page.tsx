"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, Mail, Send, Trash2, Download } from "lucide-react"

interface Subscriber {
  id: number
  email: string
  is_active: boolean
  subscribed_at: string
  unsubscribed_at?: string
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(false)
  const [newsletterSubject, setNewsletterSubject] = useState("")
  const [newsletterContent, setNewsletterContent] = useState("")
  const [sendingNewsletter, setSendingNewsletter] = useState(false)

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/newsletter/subscribers')
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendNewsletter = async () => {
    if (!newsletterSubject || !newsletterContent) {
      alert('Please fill in both subject and content')
      return
    }

    setSendingNewsletter(true)
    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newsletterSubject,
          content: newsletterContent,
        }),
      })

      if (response.ok) {
        alert('Newsletter sent successfully!')
        setNewsletterSubject("")
        setNewsletterContent("")
      } else {
        alert('Failed to send newsletter')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      alert('Error sending newsletter')
    } finally {
      setSendingNewsletter(false)
    }
  }

  const exportSubscribers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Email,Status,Subscribed At,Unsubscribed At\n"
      + subscribers.map(sub => 
          `${sub.email},${sub.is_active ? 'Active' : 'Inactive'},${sub.subscribed_at},${sub.unsubscribed_at || ''}`
        ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "newsletter_subscribers.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeSubscribers = subscribers.filter(sub => sub.is_active)
  const inactiveSubscribers = subscribers.filter(sub => !sub.is_active)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Newsletter Management</h1>
        <p className="text-gray-600">Manage your newsletter subscribers and send updates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubscribers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Subscribers</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveSubscribers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Newsletter */}
        <Card>
          <CardHeader>
            <CardTitle>Send Newsletter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={newsletterSubject}
                onChange={(e) => setNewsletterSubject(e.target.value)}
                placeholder="Newsletter subject..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newsletterContent}
                onChange={(e) => setNewsletterContent(e.target.value)}
                placeholder="Write your newsletter content..."
                rows={8}
              />
            </div>
            <Button 
              onClick={sendNewsletter}
              disabled={sendingNewsletter}
              className="w-full"
            >
              {sendingNewsletter ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sendingNewsletter ? "Sending..." : `Send to ${activeSubscribers.length} subscribers`}
            </Button>
          </CardContent>
        </Card>

        {/* Subscribers List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscribers</CardTitle>
            <Button variant="outline" size="sm" onClick={exportSubscribers}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading subscribers...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{subscriber.email}</p>
                      <p className="text-sm text-gray-500">
                        Subscribed: {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                      {subscriber.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
                {subscribers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No subscribers found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
