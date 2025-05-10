"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { PlusIcon, RefreshCw } from "lucide-react"

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
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

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
    <div className="bg-white border border-gray-100 shadow-lg">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-medium">Your Bookmarks</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateBookmarks}
            disabled={isUpdating}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3 w-3", isUpdating && "animate-spin")} />
            {isUpdating ? "Updating..." : "Update"}
          </Button>
          <Button size="sm" onClick={() => setIsAddingBookmark(true)} className="h-8 text-xs gap-1.5">
            <PlusIcon className="h-3 w-3" />
            Add Bookmark
          </Button>
        </div>
      </div>

      {isAddingBookmark && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <form onSubmit={handleAddBookmark} className="flex gap-3 items-center">
            <Input
              value={newBookmarkUrl}
              onChange={(e) => setNewBookmarkUrl(e.target.value)}
              placeholder="Enter website URL"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm">
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingBookmark(false)}>
              Cancel
            </Button>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {sortedBookmarks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No bookmarks yet. Add your first bookmark to get started.</p>
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
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
          {bookmark.name}
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{format(new Date(bookmark.lastUpdated), "MM/dd/yyyy")}</span>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 text-xs text-gray-500 hover:text-black">
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
              className={`text-sm hover:underline ${bookmark.latestContent[0].isRead ? "text-gray-500" : "text-black"}`}
            >
              {bookmark.latestContent[0].title}
            </a>
            {bookmark.latestContent[0].isNew && (
              <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 font-medium">
                New
              </span>
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
