import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface BookmarkedContent {
  id: number
  title: string
  summary: string
  publishedAt: string // Changed from Date to string
  url: string
  isNew: boolean
  isRead: boolean
}

export interface BookmarkedSite {
  id: number
  name: string
  url: string
  description: string
  bookmarked: boolean
  lastUpdated: string // Changed from Date to string
  latestContent: BookmarkedContent[]
}

interface BookmarkState {
  bookmarks: BookmarkedSite[]
  addBookmark: (url: string) => void
  removeBookmark: (id: number) => void
  updateBookmarks: () => Promise<void>
  markAsRead: (siteId: number, contentId: number) => void
}

// Helper function to convert Date objects to ISO strings
const dateToString = (date: Date): string => date.toISOString()

// Initial mock data with string dates instead of Date objects
const initialBookmarks: BookmarkedSite[] = [
  {
    id: 1,
    name: "techinsights.com",
    url: "https://techinsights.com",
    description: "Latest news and analysis on technology trends",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    latestContent: [
      {
        id: 101,
        title: "The Future of AI in Everyday Applications",
        summary:
          "How artificial intelligence is becoming integrated into our daily lives and transforming various industries from healthcare to entertainment. New developments in machine learning are making AI more accessible.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        url: "https://techinsights.com/ai-everyday-apps",
        isNew: true,
        isRead: false,
      },
    ],
  },
  {
    id: 2,
    name: "designweekly.co",
    url: "https://designweekly.co",
    description: "Curated design inspiration and resources",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    latestContent: [
      {
        id: 201,
        title: "Color Theory in Modern Web Design",
        summary:
          "How to effectively use color psychology to improve user experience and create more engaging interfaces. This guide covers color harmony, accessibility considerations, and practical implementation tips.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        url: "https://designweekly.co/color-theory",
        isNew: true,
        isRead: false,
      },
    ],
  },
  {
    id: 3,
    name: "devjournal.io",
    url: "https://devjournal.io",
    description: "Programming tutorials and best practices",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    latestContent: [
      {
        id: 301,
        title: "Building Scalable APIs with Node.js",
        summary:
          "Learn how to design and implement APIs that can handle millions of requests without compromising performance. This tutorial covers caching strategies, load balancing, and database optimization techniques.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        url: "https://devjournal.io/scalable-apis",
        isNew: false,
        isRead: true,
      },
    ],
  },
  {
    id: 4,
    name: "startupinsider.com",
    url: "https://startupinsider.com",
    description: "News and insights from the startup ecosystem",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    latestContent: [
      {
        id: 401,
        title: "How to Secure Your First Round of Funding",
        summary:
          "Expert advice on approaching investors and pitching your startup effectively. This guide includes templates for pitch decks, tips for networking with VCs, and common pitfalls to avoid during fundraising.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        url: "https://startupinsider.com/first-funding",
        isNew: false,
        isRead: false,
      },
    ],
  },
  {
    id: 5,
    name: "digitalmarketingtoday.com",
    url: "https://digitalmarketingtoday.com",
    description: "Strategies and trends in digital marketing",
    bookmarked: true,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    latestContent: [
      {
        id: 501,
        title: "Social Media Strategies for 2025",
        summary:
          "Preparing your brand for the next evolution of social platforms and changing user behaviors. This article explores emerging trends, algorithm changes, and innovative content formats that will dominate social media.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
        url: "https://digitalmarketingtoday.com/social-2025",
        isNew: false,
        isRead: true,
      },
    ],
  },
]

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: initialBookmarks,

      addBookmark: (url: string) => {
        // Ensure URL has protocol
        let formattedUrl = url
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = "https://" + formattedUrl
        }

        // Extract domain name for the name
        const name = formattedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
        const id = Math.max(...get().bookmarks.map((site) => site.id), 0) + 1

        const bookmarkToAdd: BookmarkedSite = {
          id,
          name,
          url: formattedUrl,
          description: "",
          bookmarked: true,
          lastUpdated: new Date().toISOString(),
          latestContent: [
            {
              id: id * 100,
              title: `Latest from ${name}`,
              summary: `The most recent content from ${name}. Check back later for updates as new content is published.`,
              publishedAt: new Date().toISOString(),
              url: `${formattedUrl}/latest`,
              isNew: true,
              isRead: false,
            },
          ],
        }

        set((state) => ({
          bookmarks: [...state.bookmarks, bookmarkToAdd],
        }))
      },

      removeBookmark: (id: number) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === id ? { ...bookmark, bookmarked: false } : bookmark,
          ),
        }))
      },

      updateBookmarks: async () => {
        // In a real app, this would fetch new content from the bookmarked sites
        // For now, we'll simulate updates with random new content

        set((state) => {
          const updatedBookmarks = state.bookmarks.map((bookmark) => {
            // Randomly update some bookmarks (for demo purposes)
            if (bookmark.bookmarked && Math.random() > 0.5) {
              return {
                ...bookmark,
                lastUpdated: new Date().toISOString(),
                latestContent: [
                  {
                    id: Math.floor(Math.random() * 10000),
                    title: `New: ${bookmark.name} Update ${new Date().toLocaleTimeString()}`,
                    summary: `Fresh content from ${bookmark.name} that was just published. This article covers the latest developments and provides insights into recent trends.`,
                    publishedAt: new Date().toISOString(),
                    url: `${bookmark.url}/new-content-${Date.now()}`,
                    isNew: true,
                    isRead: false,
                  },
                  ...bookmark.latestContent.map((content) => ({ ...content, isNew: false })),
                ],
              }
            }
            return bookmark
          })

          return { bookmarks: updatedBookmarks }
        })

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
      },

      markAsRead: (siteId: number, contentId: number) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === siteId
              ? {
                  ...bookmark,
                  latestContent: bookmark.latestContent.map((content) =>
                    content.id === contentId ? { ...content, isRead: true } : content,
                  ),
                }
              : bookmark,
          ),
        }))
      },
    }),
    {
      name: "bookmark-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    },
  ),
)
