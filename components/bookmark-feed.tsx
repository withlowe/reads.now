"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { Bookmark } from "lucide-react"

import { Input } from "@/components/ui/input"

// Mock data for bookmarked sites and their updates
const bookmarksData = [
  {
    id: 1,
    name: "techinsights.com",
    url: "https://techinsights.com",
    description: "Latest news and analysis on technology trends",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    latestContent: [
      {
        id: 101,
        title: "The Future of AI in Everyday Applications",
        summary:
          "How artificial intelligence is becoming integrated into our daily lives and transforming various industries from healthcare to entertainment. New developments in machine learning are making AI more accessible.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        url: "https://techinsights.com/ai-everyday-apps",
        isNew: true,
      },
    ],
  },
  {
    id: 2,
    name: "designweekly.co",
    url: "https://designweekly.co",
    description: "Curated design inspiration and resources",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    latestContent: [
      {
        id: 201,
        title: "Color Theory in Modern Web Design",
        summary:
          "How to effectively use color psychology to improve user experience and create more engaging interfaces. This guide covers color harmony, accessibility considerations, and practical implementation tips.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        url: "https://designweekly.co/color-theory",
        isNew: true,
      },
    ],
  },
  {
    id: 3,
    name: "devjournal.io",
    url: "https://devjournal.io",
    description: "Programming tutorials and best practices",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    latestContent: [
      {
        id: 301,
        title: "Building Scalable APIs with Node.js",
        summary:
          "Learn how to design and implement APIs that can handle millions of requests without compromising performance. This tutorial covers caching strategies, load balancing, and database optimization techniques.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        url: "https://devjournal.io/scalable-apis",
        isNew: false,
      },
    ],
  },
  {
    id: 4,
    name: "startupinsider.com",
    url: "https://startupinsider.com",
    description: "News and insights from the startup ecosystem",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    latestContent: [
      {
        id: 401,
        title: "How to Secure Your First Round of Funding",
        summary:
          "Expert advice on approaching investors and pitching your startup effectively. This guide includes templates for pitch decks, tips for networking with VCs, and common pitfalls to avoid during fundraising.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        url: "https://startupinsider.com/first-funding",
        isNew: false,
      },
    ],
  },
  {
    id: 5,
    name: "digitalmarketingtoday.com",
    url: "https://digitalmarketingtoday.com",
    description: "Strategies and trends in digital marketing",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    latestContent: [
      {
        id: 501,
        title: "Social Media Strategies for 2025",
        summary:
          "Preparing your brand for the next evolution of social platforms and changing user behaviors. This article explores emerging trends, algorithm changes, and innovative content formats that will dominate social media.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
        url: "https://digitalmarketingtoday.com/social-2025",
        isNew: false,
      },
    ],
  },
]

export function BookmarkFeed() {
  const [bookmarks, setBookmarks] = useState(bookmarksData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("")

  // Toggle bookmark status for a website
  const removeBookmark = (id: number) => {
    setBookmarks(bookmarks.map((site) => (site.id === id ? { ...site, bookmarked: false } : site)))
  }

  // Sort bookmarks by last updated time (most recent first)
  const sortedBookmarks = [...bookmarks]
    .filter((site) => site.bookmarked)
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

  // Update bookmarks with new content
  const updateBookmarks = () => {
    setIsUpdating(true)

    // Simulate API call delay
    setTimeout(() => {
      // Update some bookmarks with new content
      const updatedBookmarks = bookmarks.map((bookmark) => {
        // Randomly update some bookmarks (for demo purposes)
        if (Math.random() > 0.5) {
          return {
            ...bookmark,
            lastUpdated: new Date(),
            latestContent: [
              {
                id: Math.floor(Math.random() * 10000),
                title: `New: ${bookmark.name} Update ${new Date().toLocaleTimeString()}`,
                summary: `Fresh content from ${bookmark.name} that was just published. This article covers the latest developments and provides insights into recent trends.`,
                publishedAt: new Date(),
                url: `${bookmark.url}/new-content-${Date.now()}`,
                isNew: true,
              },
              ...bookmark.latestContent.map((content) => ({ ...content, isNew: false })),
            ],
          }
        }
        return bookmark
      })

      setBookmarks(updatedBookmarks)
      setIsUpdating(false)
    }, 1500)
  }

  // Add a new bookmark
  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newBookmarkUrl.trim()) {
      return
    }

    // Ensure URL has protocol
    let formattedUrl = newBookmarkUrl
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl
    }

    // Extract domain name for the name
    const name = formattedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

    const id = Math.max(...bookmarks.map((site) => site.id)) + 1

    const bookmarkToAdd: BookmarkedSite = {
      id,
      name,
      url: formattedUrl,
      description: "",
      bookmarked: true,
      lastUpdated: new Date(),
      latestContent: [
        {
          id: id * 100,
          title: `Latest from ${name}`,
          summary: `The most recent content from ${name}. Check back later for updates as new content is published.`,
          publishedAt: new Date(),
          url: `${formattedUrl}/latest`,
          isNew: true,
        },
      ],
    }

    setBookmarks([...bookmarks, bookmarkToAdd])
    setNewBookmarkUrl("")
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={updateBookmarks} className="text-sm flex items-center gap-1" disabled={isUpdating}>
            {isUpdating ? "Refreshing ..." : "Refresh"}
          </button>
        </div>

        <form onSubmit={addBookmark} className="flex gap-2 items-center border-b pb-4">
          <Input
            value={newBookmarkUrl}
            onChange={(e) => setNewBookmarkUrl(e.target.value)}
            placeholder="Add new bookmark (enter URL)"
            className="flex-1"
          />
          <button type="submit" className="text-sm flex items-center gap-1">
            <Bookmark className="h-3 w-3" />
            Add
          </button>
        </form>
      </div>

      <div className="space-y-12">
        {sortedBookmarks.map((bookmark) => (
          <BookmarkEntry key={bookmark.id} bookmark={bookmark} onRemove={() => removeBookmark(bookmark.id)} />
        ))}
      </div>
    </div>
  )
}

interface BookmarkedSite {
  id: number
  name: string
  url: string
  description: string
  bookmarked: boolean
  lastUpdated: Date
  latestContent: {
    id: number
    title: string
    summary: string
    publishedAt: Date
    url: string
    isNew: boolean
  }[]
}

interface BookmarkEntryProps {
  bookmark: BookmarkedSite
  onRemove: () => void
}

function BookmarkEntry({ bookmark, onRemove }: BookmarkEntryProps) {
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline">
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-2xl hover:text-gray-600">
          {bookmark.name}
        </a>
        <span className="text-xs text-gray-500 ml-2">{format(bookmark.lastUpdated, "MM/dd/yy")}</span>
        <button onClick={onRemove} className="ml-2 text-xs text-gray-400 hover:text-gray-900">
          remove
        </button>
      </div>

      {bookmark.latestContent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <a
              href={bookmark.latestContent[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              {bookmark.latestContent[0].title}
            </a>
            {bookmark.latestContent[0].isNew && (
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">new</span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {bookmark.latestContent[0].summary.length > 160
              ? bookmark.latestContent[0].summary.substring(0, 160) + "..."
              : bookmark.latestContent[0].summary}
          </p>
        </div>
      )}
    </div>
  )
}
