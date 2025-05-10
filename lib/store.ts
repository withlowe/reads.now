import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface BookmarkedContent {
  id: number
  title: string
  summary: string
  publishedAt: string
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
  lastUpdated: string
  latestContent: BookmarkedContent[]
  feedUrl?: string // Store the feed URL if found
}

interface BookmarkState {
  bookmarks: BookmarkedSite[]
  addBookmark: (url: string) => Promise<void>
  removeBookmark: (id: number) => void
  updateBookmarks: () => Promise<void>
  updateSingleBookmark: (id: number) => Promise<boolean>
  markAsRead: (siteId: number, contentId: number) => void
  importBookmarks: (importedBookmarks: BookmarkedSite[]) => void
}

// Sample content titles for updates - used as fallback when real fetching fails
const contentTitles = [
  "Latest Updates and News",
  "What's New This Week",
  "Recent Developments",
  "Top Stories Today",
  "Featured Content",
  "Must-Read Article",
  "Trending Now",
  "Editor's Pick",
  "Highlights",
  "Important Announcement",
]

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

// Helper function to generate simulated content for a bookmark
const generateSimulatedContent = (bookmark: BookmarkedSite) => {
  // Extract domain and path parts for more realistic content generation
  const domain = bookmark.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const pathSegment = domain.split(".")[0]

  // Generate a realistic-looking article title based on the site's domain
  const titlePrefix = ["New", "Latest", "Updated", "Fresh"][Math.floor(Math.random() * 4)]
  const titleTopic = ["Research", "Guide", "Analysis", "Report", "Feature", "Interview", "Review"][
    Math.floor(Math.random() * 7)
  ]
  const titleContent = ["on " + pathSegment, "about " + domain, "for " + pathSegment + " users"][
    Math.floor(Math.random() * 3)
  ]

  const newTitle = `${titlePrefix} ${titleTopic} ${titleContent}`

  // Generate a realistic-looking URL path
  const urlPath = `/${pathSegment}-${titleTopic.toLowerCase()}-${Date.now().toString().slice(-6)}`

  return {
    id: bookmark.id * 100 + Math.floor(Math.random() * 10000),
    title: newTitle,
    summary: `This ${titleTopic.toLowerCase()} from ${domain} explores the latest developments and provides insights into recent trends in the ${pathSegment} space. The article covers key concepts and practical applications.`,
    publishedAt: new Date().toISOString(),
    url: `${bookmark.url}${urlPath}`,
    isNew: true,
    isRead: false,
  }
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: initialBookmarks,

      addBookmark: async (url: string) => {
        // Ensure URL has protocol
        let formattedUrl = url
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = "https://" + formattedUrl
        }

        try {
          // Extract domain name for the name
          const name = formattedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
          const id = Math.max(...get().bookmarks.map((site) => site.id), 0) + 1

          // Create a basic bookmark first so the UI can update immediately
          const basicBookmark: BookmarkedSite = {
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
                url: formattedUrl,
                isNew: true,
                isRead: false,
              },
            ],
          }

          // Add the basic bookmark first
          set((state) => ({
            bookmarks: [...state.bookmarks, basicBookmark],
          }))

          // Then try to fetch real content (but don't block the UI)
          try {
            // Since we're in a client component, we'll use the simulated content for now
            // In a real app, this would be replaced with actual API calls to fetch content
            const simulatedContent = generateSimulatedContent(basicBookmark)

            // Update the bookmark with the simulated content
            setTimeout(() => {
              set((state) => ({
                bookmarks: state.bookmarks.map((b) =>
                  b.id === id
                    ? {
                        ...b,
                        latestContent: [simulatedContent, ...b.latestContent],
                      }
                    : b,
                ),
              }))
            }, 1500) // Simulate network delay
          } catch (contentError) {
            console.error("Error fetching content for new bookmark:", contentError)
            // The basic bookmark is already added, so we don't need to do anything here
          }
        } catch (error) {
          console.error("Error adding bookmark:", error)
          throw error
        }
      },

      removeBookmark: (id: number) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === id ? { ...bookmark, bookmarked: false } : bookmark,
          ),
        }))
      },

      updateSingleBookmark: async (id: number) => {
        const bookmark = get().bookmarks.find((b) => b.id === id)
        if (!bookmark || !bookmark.bookmarked) return false

        try {
          // In a real app, this would call an API to fetch content
          // For now, we'll simulate content updates
          const newContent = generateSimulatedContent(bookmark)

          // Only update if there's new content (70% chance)
          if (Math.random() < 0.7) {
            set((state) => ({
              bookmarks: state.bookmarks.map((b) =>
                b.id === id
                  ? {
                      ...b,
                      lastUpdated: new Date().toISOString(),
                      latestContent: [newContent, ...b.latestContent.map((content) => ({ ...content, isNew: false }))],
                    }
                  : b,
              ),
            }))
            return true
          }

          return false
        } catch (error) {
          console.error(`Error updating bookmark ${id}:`, error)
          return false
        }
      },

      updateBookmarks: async () => {
        const bookmarks = get().bookmarks.filter((b) => b.bookmarked)
        let updatedCount = 0

        // Update each bookmark sequentially
        for (const bookmark of bookmarks) {
          try {
            const wasUpdated = await get().updateSingleBookmark(bookmark.id)
            if (wasUpdated) updatedCount++

            // Small delay between updates
            await new Promise((resolve) => setTimeout(resolve, 300))
          } catch (error) {
            console.error(`Error updating bookmark ${bookmark.id}:`, error)
            // Continue with other bookmarks even if one fails
          }
        }

        return updatedCount
      },

      markAsRead: (siteId: number, contentId: number) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === siteId
              ? {
                  ...bookmark,
                  latestContent: bookmark.latestContent.map((content) =>
                    content.id === contentId ? { ...content, isRead: true, isNew: false } : content,
                  ),
                }
              : bookmark,
          ),
        }))
      },

      importBookmarks: (importedBookmarks: BookmarkedSite[]) => {
        // Merge imported bookmarks with existing ones
        set((state) => {
          // Get the highest ID to ensure new IDs don't conflict
          const highestId = Math.max(...state.bookmarks.map((b) => b.id), 0)

          // Process imported bookmarks to ensure they have unique IDs
          const processedImports = importedBookmarks.map((bookmark, index) => ({
            ...bookmark,
            id: highestId + index + 1,
            latestContent: bookmark.latestContent.map((content, contentIndex) => ({
              ...content,
              id: (highestId + index + 1) * 100 + contentIndex,
            })),
          }))

          // Create a map of existing bookmarks by URL for quick lookup
          const existingBookmarksByUrl = new Map(state.bookmarks.map((bookmark) => [bookmark.url, bookmark]))

          // Filter out imports that already exist (by URL)
          const newBookmarks = processedImports.filter((bookmark) => !existingBookmarksByUrl.has(bookmark.url))

          return {
            bookmarks: [...state.bookmarks, ...newBookmarks],
          }
        })
      },
    }),
    {
      name: "bookmark-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    },
  ),
)
