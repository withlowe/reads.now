"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"

import { Input } from "@/components/ui/input"

// Mock data for websites and their updates
const websitesData = [
  {
    id: 1,
    name: "techinsights.com",
    url: "https://techinsights.com",
    description: "Latest news and analysis on technology trends",
    followed: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    latestContent: [
      {
        id: 101,
        title: "The Future of AI in Everyday Applications",
        summary:
          "How artificial intelligence is becoming integrated into our daily lives and transforming various industries from healthcare to entertainment. New developments in machine learning are making AI more accessible.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        url: "https://techinsights.com/ai-everyday-apps",
      },
    ],
  },
  {
    id: 2,
    name: "designweekly.co",
    url: "https://designweekly.co",
    description: "Curated design inspiration and resources",
    followed: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    latestContent: [
      {
        id: 201,
        title: "Color Theory in Modern Web Design",
        summary:
          "How to effectively use color psychology to improve user experience and create more engaging interfaces. This guide covers color harmony, accessibility considerations, and practical implementation tips.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        url: "https://designweekly.co/color-theory",
      },
    ],
  },
  {
    id: 3,
    name: "devjournal.io",
    url: "https://devjournal.io",
    description: "Programming tutorials and best practices",
    followed: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    latestContent: [
      {
        id: 301,
        title: "Building Scalable APIs with Node.js",
        summary:
          "Learn how to design and implement APIs that can handle millions of requests without compromising performance. This tutorial covers caching strategies, load balancing, and database optimization techniques.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        url: "https://devjournal.io/scalable-apis",
      },
    ],
  },
  {
    id: 4,
    name: "startupinsider.com",
    url: "https://startupinsider.com",
    description: "News and insights from the startup ecosystem",
    followed: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    latestContent: [
      {
        id: 401,
        title: "How to Secure Your First Round of Funding",
        summary:
          "Expert advice on approaching investors and pitching your startup effectively. This guide includes templates for pitch decks, tips for networking with VCs, and common pitfalls to avoid during fundraising.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        url: "https://startupinsider.com/first-funding",
      },
    ],
  },
  {
    id: 5,
    name: "digitalmarketingtoday.com",
    url: "https://digitalmarketingtoday.com",
    description: "Strategies and trends in digital marketing",
    followed: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    latestContent: [
      {
        id: 501,
        title: "Social Media Strategies for 2025",
        summary:
          "Preparing your brand for the next evolution of social platforms and changing user behaviors. This article explores emerging trends, algorithm changes, and innovative content formats that will dominate social media.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
        url: "https://digitalmarketingtoday.com/social-2025",
      },
    ],
  },
]

export function WebsiteFeed() {
  const [websites, setWebsites] = useState(websitesData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newSiteUrl, setNewSiteUrl] = useState("")

  // Toggle follow status for a website
  const toggleFollow = (id: number) => {
    setWebsites(websites.map((site) => (site.id === id ? { ...site, followed: !site.followed } : site)))
  }

  // Sort websites by last updated time (most recent first)
  const sortedWebsites = [...websites]
    .filter((site) => site.followed)
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

  // Refresh the feed with updated content
  const refreshFeed = () => {
    setIsRefreshing(true)

    // Simulate API call delay
    setTimeout(() => {
      // Update some websites with new content
      const updatedWebsites = websites.map((website) => {
        // Randomly update some websites (for demo purposes)
        if (Math.random() > 0.5) {
          return {
            ...website,
            lastUpdated: new Date(),
            latestContent: [
              {
                id: Math.floor(Math.random() * 10000),
                title: `New: ${website.name} Update ${new Date().toLocaleTimeString()}`,
                summary: `Fresh content from ${website.name} that was just published. This article covers the latest developments and provides insights into recent trends.`,
                publishedAt: new Date(),
                url: `${website.url}/new-content-${Date.now()}`,
              },
              ...website.latestContent,
            ],
          }
        }
        return website
      })

      setWebsites(updatedWebsites)
      setIsRefreshing(false)
    }, 1500)
  }

  // Add a new website to the feed
  const addWebsite = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSiteUrl.trim()) {
      return
    }

    // Ensure URL has protocol
    let formattedUrl = newSiteUrl
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl
    }

    // Extract domain name for the name
    const name = formattedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

    const id = Math.max(...websites.map((site) => site.id)) + 1

    const websiteToAdd: Website = {
      id,
      name,
      url: formattedUrl,
      description: "",
      followed: true,
      lastUpdated: new Date(),
      latestContent: [
        {
          id: id * 100,
          title: `Latest from ${name}`,
          summary: `The most recent content from ${name}. Check back later for updates as new content is published.`,
          publishedAt: new Date(),
          url: `${formattedUrl}/latest`,
        },
      ],
    }

    setWebsites([...websites, websiteToAdd])
    setNewSiteUrl("")
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={refreshFeed} className="text-sm" disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <form onSubmit={addWebsite} className="flex gap-2 items-center border-b pb-4">
          <Input
            value={newSiteUrl}
            onChange={(e) => setNewSiteUrl(e.target.value)}
            placeholder="Add new site (enter URL)"
            className="flex-1"
          />
          <button type="submit" className="text-sm">
            Add
          </button>
        </form>
      </div>

      <div className="space-y-12">
        {sortedWebsites.map((website) => (
          <WebsiteEntry key={website.id} website={website} onUnfollow={() => toggleFollow(website.id)} />
        ))}
      </div>
    </div>
  )
}

interface Website {
  id: number
  name: string
  url: string
  description: string
  followed: boolean
  lastUpdated: Date
  latestContent: {
    id: number
    title: string
    summary: string
    publishedAt: Date
    url: string
  }[]
}

interface WebsiteEntryProps {
  website: Website
  onUnfollow: () => void
}

function WebsiteEntry({ website, onUnfollow }: WebsiteEntryProps) {
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline">
        <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-2xl hover:text-gray-600">
          {website.name}
        </a>
        <span className="text-xs text-gray-500 ml-2">{format(website.lastUpdated, "MM/dd/yy")}</span>
        <button onClick={onUnfollow} className="ml-2 text-xs text-gray-400 hover:text-gray-900">
          unfollow
        </button>
      </div>

      {website.latestContent.length > 0 && (
        <div className="space-y-2">
          <a
            href={website.latestContent[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 hover:text-black block"
          >
            {website.latestContent[0].title}
          </a>
          <p className="text-sm text-gray-600 leading-relaxed">
            {website.latestContent[0].summary.length > 160
              ? website.latestContent[0].summary.substring(0, 160) + "..."
              : website.latestContent[0].summary}
          </p>
        </div>
      )}
    </div>
  )
}
