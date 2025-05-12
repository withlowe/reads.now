"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, RefreshCw, Upload } from "lucide-react"
import { useBookmarkStore } from "@/lib/simple-store"

export function SimpleBookmarkFeed() {
  const { bookmarks, addBookmark, removeBookmark, markAsRead, checkForUpdates } = useBookmarkStore()
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("")
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  // Filter only bookmarked sites
  const activeBookmarks = bookmarks.filter((bookmark) => bookmark.bookmarked)

  // Sort bookmarks by last updated time (most recent first)
  const sortedBookmarks = [...activeBookmarks].sort((a, b) => {
    // First sort by whether the site has new content
    const aHasNew = a.latestContent.some((content) => content.isNew)
    const bHasNew = b.latestContent.some((content) => content.isNew)

    if (aHasNew && !bHasNew) return -1
    if (!aHasNew && bHasNew) return 1

    // Then sort by last updated date
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  })

  // Add a new bookmark
  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newBookmarkUrl.trim()) {
      return
    }

    addBookmark(newBookmarkUrl)
    setNewBookmarkUrl("")
    setIsAddingBookmark(false)
  }

  // Handle clicking on content to mark as read
  const handleContentClick = (siteId: number, contentId: number) => {
    markAsRead(siteId, contentId)
  }

  // Handle checking for updates
  const handleCheckForUpdates = async () => {
    setIsChecking(true)
    setUpdateStatus(null)

    try {
      const updatedCount = await checkForUpdates()

      if (updatedCount > 0) {
        setUpdateStatus(`Found updates for ${updatedCount} of ${activeBookmarks.length} bookmarks`)
      } else {
        setUpdateStatus(`No new content found for ${activeBookmarks.length} bookmarks`)
      }

      // Clear status after 5 seconds
      setTimeout(() => {
        setUpdateStatus(null)
      }, 5000)
    } catch (error) {
      console.error("Error checking for updates:", error)
      setUpdateStatus("Error checking for updates")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg w-full transition-colors duration-300">
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Bookmarks</h2>

            {/* Export icon */}
            <button
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-300"
              title="Export bookmarks"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="h-9 px-4 py-2 text-sm gap-1.5 flex-1 sm:flex-initial border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-300 flex items-center"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => setIsAddingBookmark(true)}
              className="h-9 px-4 py-2 text-sm gap-1.5 flex-1 sm:flex-initial bg-black text-white hover:bg-gray-800 transition-colors duration-300 flex items-center"
            >
              <PlusIcon className="h-3.5 w-3.5 mr-1" />
              Add Bookmark
            </button>
          </div>
        </div>

        {updateStatus && (
          <div className="px-4 py-2 text-sm text-center bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300">
            {updateStatus}
          </div>
        )}

        {isAddingBookmark && (
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
            <form onSubmit={handleAddBookmark} className="flex flex-col gap-2">
              <div className="flex items-center">
                <input
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  placeholder="Enter website URL"
                  className="flex-1 text-sm h-9 transition-colors duration-300 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="h-9 px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 transition-colors duration-300"
                >
                  Add Bookmark
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingBookmark(false)}
                  className="h-9 px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors duration-300">
          {sortedBookmarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
              <p className="text-base">No bookmarks yet. Add your first bookmark to get started.</p>
            </div>
          ) : (
            sortedBookmarks.map((bookmark) => (
              <SimpleBookmarkEntry
                key={bookmark.id}
                bookmark={bookmark}
                onRemove={() => removeBookmark(bookmark.id)}
                onContentClick={handleContentClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface SimpleBookmarkEntryProps {
  bookmark: ReturnType<typeof useBookmarkStore>["bookmarks"][0]
  onRemove: () => void
  onContentClick: (siteId: number, contentId: number) => void
}

function SimpleBookmarkEntry({ bookmark, onRemove, onContentClick }: SimpleBookmarkEntryProps) {
  // Safely format the date by parsing the ISO string
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Get the latest content
  const latestContent = bookmark.latestContent[0]
  const isNew = latestContent?.isNew

  // Handle click on the bookmark entry to mark content as read
  const handleEntryClick = (e: React.MouseEvent) => {
    // Only mark as read if the click was directly on the container
    // and not on any of its interactive children
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("bookmark-entry-container")) {
      if (latestContent && latestContent.isNew) {
        onContentClick(bookmark.id, latestContent.id)
      }
    }
  }

  // Handle click on the description to mark content as read
  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the parent div's click handler from firing
    if (latestContent) {
      onContentClick(bookmark.id, latestContent.id)
    }
  }

  return (
    <div
      className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 cursor-pointer bookmark-entry-container"
      onClick={handleEntryClick}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline flex-wrap gap-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-medium tracking-tight hover:text-gray-600 transition-colors duration-300"
            onClick={(e) => {
              // Stop propagation to prevent the parent div's click handler from firing
              e.stopPropagation()
            }}
          >
            {bookmark.name}
          </a>
          {isNew && <span className="text-xs bg-black text-white px-1.5 py-0.5 font-medium">New</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono transition-colors duration-300">
            {formatDate(bookmark.lastUpdated)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-mono transition-colors duration-300"
          >
            Remove
          </button>
        </div>
      </div>

      {latestContent && (
        <div
          className="text-base sm:text-base font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors duration-300"
          onClick={handleDescriptionClick}
        >
          {latestContent.title}
        </div>
      )}
    </div>
  )
}
