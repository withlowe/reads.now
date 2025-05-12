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

// Sample content titles for updates
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

        // Simulate a delay for the update check
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Randomly select some bookmarks to update (for demo purposes)
        let updatedCount = 0
        const updatedBookmarks = activeBookmarks.map((bookmark) => {
          // Randomly decide if this bookmark has an update (50% chance)
          const hasUpdate = Math.random() > 0.5

          if (hasUpdate) {
            updatedCount++

            // Generate a random title from the sample titles
            const randomTitleIndex = Math.floor(Math.random() * contentTitles.length)
            const newTitle = contentTitles[randomTitleIndex]

            // Create a new content item
            const newContent = {
              id: bookmark.id * 100 + Math.floor(Math.random() * 1000),
              title: newTitle,
              summary:
                "New content found on " + bookmark.name + ". This update was discovered during the latest check.",
              publishedAt: new Date().toISOString(),
              url: bookmark.url + "/new-content-" + Date.now(),
              isNew: true,
              isRead: false,
            }

            // Mark existing content as not new
            const updatedContent = bookmark.latestContent.map((content) => ({
              ...content,
              isNew: false,
            }))

            // Return updated bookmark
            return {
              ...bookmark,
              lastUpdated: new Date().toISOString(),
              latestContent: [newContent, ...updatedContent],
            }
          }

          // No update for this bookmark
          return bookmark
        })

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
