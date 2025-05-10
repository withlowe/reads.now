"use client"

import type React from "react"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, RefreshCw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBookmarkStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function BookmarkFeed() {
  const { bookmarks, addBookmark, removeBookmark, updateBookmarks, markAsRead } = useBookmarkStore()

  const [isUpdating, setIsUpdating] = useState(false)
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("")
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)

  // Sort bookmarks by last updated time (most recent first)
  const sortedBookmarks = [...bookmarks]
    .filter((site) => site.bookmarked)
    .sort((a, b) => {
      // Parse ISO strings back to Date objects for comparison
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    })

  // Update bookmarks with new content
  const handleUpdateBookmarks = async () => {
    setIsUpdating(true)
    await updateBookmarks()
    setIsUpdating(false)
  }

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

  return (
    <div className="bg-white border border-gray-100 shadow-lg w-full">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight">Your Bookmarks</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateBookmarks}
            disabled={isUpdating}
            className="h-9 text-sm gap-1.5 flex-1 sm:flex-initial"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
            {isUpdating ? "Updating..." : "Update"}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddingBookmark(true)}
            className="h-9 text-sm gap-1.5 flex-1 sm:flex-initial bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Bookmark
          </Button>
        </div>
      </div>

      {isAddingBookmark && (
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
          <form onSubmit={handleAddBookmark} className="flex flex-col gap-2">
            <div className="flex items-center">
              <Input
                value={newBookmarkUrl}
                onChange={(e) => setNewBookmarkUrl(e.target.value)}
                placeholder="Enter website URL"
                className="flex-1 text-sm h-9"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingBookmark(false)}
                className="ml-1 h-9 w-9 p-0 flex-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
            <Button type="submit" size="sm" className="h-9 text-sm bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90">
              Add Bookmark
            </Button>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {sortedBookmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base">No bookmarks yet. Add your first bookmark to get started.</p>
          </div>
        ) : (
          sortedBookmarks.map((bookmark) => (
            <BookmarkEntry
              key={bookmark.id}
              bookmark={bookmark}
              onRemove={() => removeBookmark(bookmark.id)}
              onContentClick={handleContentClick}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface BookmarkEntryProps {
  bookmark: ReturnType<typeof useBookmarkStore>["bookmarks"][0]
  onRemove: () => void
  onContentClick: (siteId: number, contentId: number) => void
}

function BookmarkEntry({ bookmark, onRemove, onContentClick }: BookmarkEntryProps) {
  // Safely format the date by parsing the ISO string
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MM/dd/yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg sm:text-xl font-medium tracking-tight hover:text-[#00FF9D] transition-colors"
        >
          {bookmark.name}
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 tabular-nums">{formatDate(bookmark.lastUpdated)}</span>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 text-xs text-gray-500 hover:text-black">
            Remove
          </Button>
        </div>
      </div>

      {bookmark.latestContent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <a
              href={bookmark.latestContent[0].url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onContentClick(bookmark.id, bookmark.latestContent[0].id)}
              className={`text-base sm:text-lg font-medium tracking-tight hover:text-[#00FF9D] transition-colors ${
                bookmark.latestContent[0].isRead ? "text-gray-500" : "text-black"
              }`}
            >
              {bookmark.latestContent[0].title}
            </a>
            {bookmark.latestContent[0].isNew && (
              <span className="text-xs bg-[#00FF9D] text-black px-1.5 py-0.5 font-medium">New</span>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {bookmark.latestContent[0].summary.length > 160
              ? bookmark.latestContent[0].summary.substring(0, 160) + "..."
              : bookmark.latestContent[0].summary}
          </p>
        </div>
      )}
    </div>
  )
}
