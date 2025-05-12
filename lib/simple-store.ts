"use client"

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
  lastChecked?: string
  contentHash?: string // Store content hash for comparison
  latestContent: BookmarkedContent[]
}

interface BookmarkState {
  bookmarks: BookmarkedSite[]
  addBookmark: (url: string) => void
  removeBookmark: (id: number) => void
  markAsRead: (siteId: number, contentId: number) => void
  checkForUpdates: () => Promise<number>
}

// Initial mock data
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
          "How artificial intelligence is becoming integrated into our daily lives and transforming various industries from healthcare to entertainment.",
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
          "How to effectively use color psychology to improve user experience and create more engaging interfaces.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        url: "https://designweekly.co/color-theory",
        isNew: true,
        isRead: false,
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

        // Create a new bookmark
        const newBookmark: BookmarkedSite = {
          id,
          name,
          url: formattedUrl,
          description: "Added bookmark",
          bookmarked: true,
          lastUpdated: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          latestContent: [
            {
              id: id * 100,
              title: "Latest from " + name,
              summary: "The most recent content from " + name + ". Check back later for updates.",
              publishedAt: new Date().toISOString(),
              url: formattedUrl,
              isNew: true,
              isRead: false,
            },
          ],
        }

        // Add the bookmark
        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
        }))

        // Optionally, fetch initial content hash in the background
        fetch("/api/check-updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formattedUrl }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.contentHash) {
              set((state) => ({
                bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, contentHash: data.contentHash } : b)),
              }))
            }
          })
          .catch((error) => console.error("Error fetching initial content:", error))
      },

      removeBookmark: (id: number) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === id ? { ...bookmark, bookmarked: false } : bookmark,
          ),
        }))
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

      checkForUpdates: async () => {
        // Get active bookmarks
        const activeBookmarks = get().bookmarks.filter((b) => b.bookmarked)
        let updatedCount = 0
        const updatedBookmarks = [...get().bookmarks]
        const now = new Date()

        // Check each bookmark for updates
        for (const bookmark of activeBookmarks) {
          try {
            // Find the bookmark in our array
            const bookmarkIndex = updatedBookmarks.findIndex((b) => b.id === bookmark.id)
            if (bookmarkIndex === -1) continue

            // Update the lastChecked timestamp
            updatedBookmarks[bookmarkIndex] = {
              ...updatedBookmarks[bookmarkIndex],
              lastChecked: now.toISOString(),
            }

            // Call our API to check for updates
            const response = await fetch("/api/check-updates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: bookmark.url,
                lastContentHash: bookmark.contentHash,
              }),
            })

            if (!response.ok) {
              console.error(`Error checking ${bookmark.name}:`, await response.text())
              continue
            }

            const data = await response.json()

            // If content has changed
            if (data.hasChanged) {
              updatedCount++

              // Create a new content item
              const newContent = {
                id: bookmark.id * 100 + Math.floor(now.getTime() % 10000),
                title: data.title || `New content on ${bookmark.name}`,
                summary: data.summary || `There appears to be new content on ${bookmark.name}.`,
                publishedAt: now.toISOString(),
                url: bookmark.url,
                isNew: true,
                isRead: false,
              }

              // Mark existing content as not new
              const updatedContent = updatedBookmarks[bookmarkIndex].latestContent.map((content) => ({
                ...content,
                isNew: false,
              }))

              // Update the bookmark
              updatedBookmarks[bookmarkIndex] = {
                ...updatedBookmarks[bookmarkIndex],
                lastUpdated: now.toISOString(),
                contentHash: data.contentHash,
                latestContent: [newContent, ...updatedContent],
              }
            }

            // Add a small delay between requests to avoid overwhelming servers
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            console.error(`Error checking ${bookmark.name}:`, error)
          }
        }

        // Update the store with the new bookmarks
        set({ bookmarks: updatedBookmarks })

        // Return the number of bookmarks that were updated
        return updatedCount
      },
    }),
    {
      name: "bookmark-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    },
  ),
)
