import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { parseFeed, discoverFeeds } from "@/lib/feed-parser"
import { JSDOM } from "jsdom"
import crypto from "crypto"

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
  etag?: string // Store ETag for HTTP caching
  lastModified?: string // Store Last-Modified header
  contentHash?: string // Store content hash for comparison
  lastCheckedSelector?: string // Store selector used for specific content checking
  lastCheckedContent?: string // Store the content of the selector for comparison
}

interface BookmarkState {
  bookmarks: BookmarkedSite[]
  addBookmark: (url: string) => Promise<void>
  removeBookmark: (id: number) => void
  updateBookmarks: () => Promise<number>
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

// Helper function to check for updates using HTTP headers
async function checkForUpdatesWithHeaders(url: string, lastEtag?: string, lastModified?: string) {
  try {
    const headers: HeadersInit = {}

    if (lastEtag) {
      headers["If-None-Match"] = lastEtag
    }

    if (lastModified) {
      headers["If-Modified-Since"] = lastModified
    }

    const response = await fetch(url, {
      headers,
      method: "HEAD",
      // Add a cache-busting parameter to avoid browser caching
      cache: "no-store",
    })

    if (response.status === 304) {
      console.log("Content has not changed (304 Not Modified)")
      return { changed: false }
    } else {
      console.log("Content may have changed (status: " + response.status + ")")
      // Store new ETag and Last-Modified for future checks
      const newEtag = response.headers.get("ETag")
      const newModified = response.headers.get("Last-Modified")
      return {
        changed: true,
        etag: newEtag || undefined,
        lastModified: newModified || undefined,
      }
    }
  } catch (error) {
    console.error("Error checking headers:", error)
    // If there's an error, we'll fall back to other methods
    return { changed: true }
  }
}

// Helper function to check content hash
async function checkContentHash(url: string, previousHash?: string) {
  try {
    const response = await fetch(url, { cache: "no-store" })
    const content = await response.text()

    // Create a hash of the content
    const hash = crypto.createHash("md5").update(content).digest("hex")

    if (hash === previousHash) {
      console.log("Content hash has not changed")
      return { changed: false, newHash: hash }
    } else {
      console.log("Content hash has changed")
      return { changed: true, newHash: hash }
    }
  } catch (error) {
    console.error("Error checking content hash:", error)
    return { changed: true }
  }
}

// Helper function to check specific content
async function checkSpecificContent(
  url: string,
  selector = "main, article, .content, #content",
  previousContent?: string,
) {
  try {
    const response = await fetch(url, { cache: "no-store" })
    const html = await response.text()

    const dom = new JSDOM(html)
    const element = dom.window.document.querySelector(selector)
    const content = element ? element.textContent?.trim() : ""

    return {
      changed: content !== previousContent,
      newContent: content,
      selector,
    }
  } catch (error) {
    console.error("Error checking specific content:", error)
    return { changed: true, selector }
  }
}

// Helper function to generate simulated content for a bookmark
const generateSimulatedContent = (bookmark: BookmarkedSite) => {
  // Extract domain and path parts for more realistic content generation
  const domain = bookmark.url.replace(/^https?:\/\//, "").replace(/\/$/g, "")
  const pathSegment = domain.split(".")[0]

  // Generate a realistic-looking article title based on the site's domain
  const titleOptions = ["New", "Latest", "Updated", "Fresh"]
  const titlePrefix = titleOptions[Math.floor(Math.random() * titleOptions.length)]

  const topicOptions = ["Research", "Guide", "Analysis", "Report", "Feature", "Interview", "Review"]
  const titleTopic = topicOptions[Math.floor(Math.random() * topicOptions.length)]

  const contentOptions = ["on " + pathSegment, "about " + domain, "for " + pathSegment + " users"]
  const titleContent = contentOptions[Math.floor(Math.random() * contentOptions.length)]

  const newTitle = titlePrefix + " " + titleTopic + " " + titleContent

  // Generate a realistic-looking URL path
  const urlPath = "/" + pathSegment + "-" + titleTopic.toLowerCase() + "-" + Date.now().toString().slice(-6)

  return {
    id: bookmark.id * 100 + Math.floor(Math.random() * 10000),
    title: newTitle,
    summary:
      "This " +
      titleTopic.toLowerCase() +
      " from " +
      domain +
      " explores the latest developments and provides insights into recent trends in the " +
      pathSegment +
      " space. The article covers key concepts and practical applications.",
    publishedAt: new Date().toISOString(),
    url: bookmark.url + urlPath,
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
            // Try to discover feeds for this site
            const feedUrls = await discoverFeeds(formattedUrl)
            let updatedBookmark = { ...basicBookmark }

            if (feedUrls.length > 0) {
              // Use the first feed found
              const feedData = await parseFeed(feedUrls[0])

              if (feedData && feedData.items.length > 0) {
                // Update the bookmark with feed data
                updatedBookmark = {
                  ...updatedBookmark,
                  feedUrl: feedUrls[0],
                  description: feedData.description || updatedBookmark.description,
                  latestContent: feedData.items.slice(0, 5).map((item, index) => ({
                    id: id * 100 + index,
                    title: item.title,
                    summary: item.description,
                    publishedAt: item.pubDate,
                    url: item.link,
                    isNew: true,
                    isRead: false,
                  })),
                }
              }
            } else {
              // If no feed found, try to get content hash and specific content
              const hashResult = await checkContentHash(formattedUrl)
              const contentResult = await checkSpecificContent(formattedUrl)

              updatedBookmark = {
                ...updatedBookmark,
                contentHash: hashResult.newHash,
                lastCheckedSelector: contentResult.selector,
                lastCheckedContent: contentResult.newContent,
              }
            }

            // Update the bookmark with the fetched data
            set((state) => ({
              bookmarks: state.bookmarks.map((b) => (b.id === id ? updatedBookmark : b)),
            }))
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
          let hasUpdates = false
          let updatedBookmark = { ...bookmark }

          // Step 1: Check if the site has a feed URL
          if (bookmark.feedUrl) {
            try {
              const feedData = await parseFeed(bookmark.feedUrl)

              if (feedData && feedData.items.length > 0) {
                // Check if the latest item is newer than our latest content
                const latestFeedDate = new Date(feedData.items[0].pubDate)
                const latestStoredDate =
                  bookmark.latestContent.length > 0 ? new Date(bookmark.latestContent[0].publishedAt) : new Date(0)

                if (latestFeedDate > latestStoredDate) {
                  hasUpdates = true

                  // Add new content items
                  const newContentItems = feedData.items
                    .filter((item) => new Date(item.pubDate) > latestStoredDate)
                    .map((item) => ({
                      id: bookmark.id * 100 + Math.floor(Math.random() * 10000),
                      title: item.title,
                      summary: item.description,
                      publishedAt: item.pubDate,
                      url: item.link,
                      isNew: true,
                      isRead: false,
                    }))

                  updatedBookmark = {
                    ...updatedBookmark,
                    lastUpdated: new Date().toISOString(),
                    latestContent: [...newContentItems, ...bookmark.latestContent],
                  }
                }
              }
            } catch (feedError) {
              console.error(`Error checking feed for ${bookmark.name}:`, feedError)
              // If feed checking fails, fall back to other methods
            }
          }

          // Step 2: If no updates from feed or no feed exists, check HTTP headers
          if (!hasUpdates) {
            try {
              const headerResult = await checkForUpdatesWithHeaders(bookmark.url, bookmark.etag, bookmark.lastModified)

              if (headerResult.changed) {
                // Headers indicate content has changed
                hasUpdates = true
                updatedBookmark = {
                  ...updatedBookmark,
                  etag: headerResult.etag,
                  lastModified: headerResult.lastModified,
                }
              } else {
                // No changes according to headers, we can stop here
                return false
              }
            } catch (headerError) {
              console.error(`Error checking headers for ${bookmark.name}:`, headerError)
              // Continue to other methods if header check fails
            }
          }

          // Step 3: If still no updates or headers didn't provide conclusive results, check content hash
          if (!hasUpdates) {
            try {
              const hashResult = await checkContentHash(bookmark.url, bookmark.contentHash)

              if (hashResult.changed) {
                hasUpdates = true
                updatedBookmark = {
                  ...updatedBookmark,
                  contentHash: hashResult.newHash,
                }
              } else {
                // No changes according to content hash
                return false
              }
            } catch (hashError) {
              console.error(`Error checking content hash for ${bookmark.name}:`, hashError)
              // Continue to the next method
            }
          }

          // Step 4: If still no updates or previous methods failed, check specific content
          if (!hasUpdates) {
            try {
              const contentResult = await checkSpecificContent(
                bookmark.url,
                bookmark.lastCheckedSelector,
                bookmark.lastCheckedContent,
              )

              if (contentResult.changed) {
                hasUpdates = true
                updatedBookmark = {
                  ...updatedBookmark,
                  lastCheckedSelector: contentResult.selector,
                  lastCheckedContent: contentResult.newContent,
                }
              } else {
                // No changes according to specific content check
                return false
              }
            } catch (contentError) {
              console.error(`Error checking specific content for ${bookmark.name}:`, contentError)
            }
          }

          // If we've detected updates but don't have new content items yet, try to get them
          if (hasUpdates && updatedBookmark.latestContent.length === bookmark.latestContent.length) {
            try {
              // Try to discover feeds first (in case a feed was added since last check)
              if (!bookmark.feedUrl) {
                const feedUrls = await discoverFeeds(bookmark.url)
                if (feedUrls.length > 0) {
                  const feedData = await parseFeed(feedUrls[0])

                  if (feedData && feedData.items.length > 0) {
                    // We found a feed! Update the bookmark with feed data
                    updatedBookmark = {
                      ...updatedBookmark,
                      feedUrl: feedUrls[0],
                      description: feedData.description || updatedBookmark.description,
                      lastUpdated: new Date().toISOString(),
                      latestContent: [
                        ...feedData.items.slice(0, 3).map((item) => ({
                          id: bookmark.id * 100 + Math.floor(Math.random() * 10000),
                          title: item.title,
                          summary: item.description,
                          publishedAt: item.pubDate,
                          url: item.link,
                          isNew: true,
                          isRead: false,
                        })),
                        ...bookmark.latestContent.map((content) => ({ ...content, isNew: false })),
                      ],
                    }

                    // Update the bookmark and return success
                    set((state) => ({
                      bookmarks: state.bookmarks.map((b) => (b.id === id ? updatedBookmark : b)),
                    }))
                    return true
                  }
                }
              }

              // If we couldn't get content from a feed, try to scrape the page
              try {
                const response = await fetch(bookmark.url, { cache: "no-store" })
                const html = await response.text()
                const dom = new JSDOM(html)
                const document = dom.window.document

                // Try to find the title
                const titleElement = document.querySelector("h1, h2, .title, .headline, article h3")
                const title = titleElement ? titleElement.textContent?.trim() : `New content from ${bookmark.name}`

                // Try to find some content for the summary
                const contentElement = document.querySelector("article p, .content p, main p")
                const summary = contentElement
                  ? contentElement.textContent?.trim()
                  : `There appears to be new content on ${bookmark.name}. Click to visit the site.`

                // Create a new content item
                const newContent = {
                  id: bookmark.id * 100 + Math.floor(Math.random() * 10000),
                  title: title || `New content from ${bookmark.name}`,
                  summary: summary || `There appears to be new content on ${bookmark.name}. Click to visit the site.`,
                  publishedAt: new Date().toISOString(),
                  url: bookmark.url,
                  isNew: true,
                  isRead: false,
                }

                updatedBookmark = {
                  ...updatedBookmark,
                  lastUpdated: new Date().toISOString(),
                  latestContent: [
                    newContent,
                    ...bookmark.latestContent.map((content) => ({ ...content, isNew: false })),
                  ],
                }
              } catch (scrapeError) {
                console.error(`Error scraping content for ${bookmark.name}:`, scrapeError)

                // If all else fails, generate a simulated content item
                const newContent = generateSimulatedContent(bookmark)

                updatedBookmark = {
                  ...updatedBookmark,
                  lastUpdated: new Date().toISOString(),
                  latestContent: [
                    newContent,
                    ...bookmark.latestContent.map((content) => ({ ...content, isNew: false })),
                  ],
                }
              }
            } catch (contentFetchError) {
              console.error(`Error fetching new content for ${bookmark.name}:`, contentFetchError)

              // If all else fails, generate a simulated content item
              const newContent = generateSimulatedContent(bookmark)

              updatedBookmark = {
                ...updatedBookmark,
                lastUpdated: new Date().toISOString(),
                latestContent: [newContent, ...bookmark.latestContent.map((content) => ({ ...content, isNew: false }))],
              }
            }
          }

          // Update the bookmark if we have changes
          if (hasUpdates) {
            set((state) => ({
              bookmarks: state.bookmarks.map((b) => (b.id === id ? updatedBookmark : b)),
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

            // Small delay between updates to avoid overwhelming servers
            await new Promise((resolve) => setTimeout(resolve, 500))
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
