"use client"

import type React from "react"

import { useState, useRef } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, RefreshCw, Download, Upload, Check, AlertCircle, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBookmarkStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SearchBar } from "@/components/search-bar"

interface BookmarkFeedProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  compactMode: boolean
  setCompactMode: (mode: boolean) => void
}

export function BookmarkFeed({ searchQuery, setSearchQuery, compactMode, setCompactMode }: BookmarkFeedProps) {
  const { bookmarks, addBookmark, removeBookmark, updateBookmarks, markAsRead, importBookmarks } = useBookmarkStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUpdating, setIsUpdating] = useState(false)
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("")
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [isAddingBookmarkLoading, setIsAddingBookmarkLoading] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" | null }>({
    text: "",
    type: null,
  })

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!searchQuery.trim()) return bookmark.bookmarked

    const query = searchQuery.toLowerCase()
    return (
      bookmark.bookmarked &&
      (bookmark.name.toLowerCase().includes(query) ||
        bookmark.description.toLowerCase().includes(query) ||
        bookmark.latestContent.some(
          (content) => content.title.toLowerCase().includes(query) || content.summary.toLowerCase().includes(query),
        ))
    )
  })

  // Sort bookmarks by last updated time (most recent first)
  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    // First sort by whether the site has new content
    const aHasNew = a.latestContent.some((content) => content.isNew)
    const bHasNew = b.latestContent.some((content) => content.isNew)

    if (aHasNew && !bHasNew) return -1
    if (!aHasNew && bHasNew) return 1

    // Then sort by last updated date
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  })

  // Show status message and clear it after a delay
  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMessage({ text, type })
    setTimeout(() => {
      setStatusMessage({ text: "", type: null })
    }, 3000)
  }

  // Update bookmarks with new content
  const handleUpdateBookmarks = async () => {
    setIsUpdating(true)
    try {
      await updateBookmarks()
      showStatus("Bookmarks updated successfully", "success")
    } catch (error) {
      console.error("Error updating bookmarks:", error)
      showStatus("Failed to update bookmarks", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  // Add a new bookmark
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newBookmarkUrl.trim()) {
      return
    }

    setIsAddingBookmarkLoading(true)
    try {
      await addBookmark(newBookmarkUrl)
      showStatus("Bookmark added successfully", "success")
      setNewBookmarkUrl("")
      setIsAddingBookmark(false)
    } catch (error) {
      console.error("Error adding bookmark:", error)
      showStatus("Failed to add bookmark", "error")
    } finally {
      setIsAddingBookmarkLoading(false)
    }
  }

  // Handle clicking on content to mark as read
  const handleContentClick = (siteId: number, contentId: number) => {
    markAsRead(siteId, contentId)
  }

  // Handle file import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data && Array.isArray(data.bookmarks)) {
        importBookmarks(data.bookmarks)
        setImportStatus("success")

        // Reset status after 3 seconds
        setTimeout(() => {
          setImportStatus("idle")
          setImportDialogOpen(false)
        }, 3000)
      } else {
        throw new Error("Invalid bookmark format")
      }
    } catch (error) {
      console.error("Error importing bookmarks:", error)
      setImportStatus("error")

      // Reset status after 3 seconds
      setTimeout(() => {
        setImportStatus("idle")
      }, 3000)
    }

    // Clear the input
    e.target.value = ""
  }

  // Handle export
  const handleExport = () => {
    try {
      // Create a JSON blob with the bookmarks
      const data = { bookmarks: bookmarks }
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: "application/json" })

      // Create a download link and trigger it
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reads-now-bookmarks-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportStatus("success")

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus("idle")
        setExportDialogOpen(false)
      }, 3000)
    } catch (error) {
      console.error("Error exporting bookmarks:", error)
      setExportStatus("error")

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus("idle")
      }, 3000)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      {/* Search bar above the feed */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg w-full transition-colors duration-300">
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {searchQuery ? `Search: "${searchQuery}"` : "Bookmarks"}
            </h2>
            <button
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-[#00FF9D] dark:hover:text-[#00FF9D] transition-colors duration-300"
              title="Import bookmarks"
              onClick={() => setImportDialogOpen(true)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Import</span>
            </button>
            <button
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-[#00FF9D] dark:hover:text-[#00FF9D] transition-colors duration-300"
              title="Export bookmarks"
              onClick={() => setExportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </button>
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />

            {compactMode && (
              <button
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-[#00FF9D] dark:hover:text-[#00FF9D] transition-colors duration-300 ml-2"
                title="Show header"
                onClick={() => setCompactMode(false)}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Show header</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateBookmarks}
              disabled={isUpdating}
              className="h-9 text-sm gap-1.5 flex-1 sm:flex-initial transition-colors duration-300"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
              {isUpdating ? "Checking sites..." : "Check for updates"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddingBookmark(true)}
              className="h-9 text-sm gap-1.5 flex-1 sm:flex-initial bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90 transition-colors duration-300"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Bookmark
            </Button>
          </div>
        </div>

        {/* Status message */}
        {statusMessage.type && (
          <div
            className={cn(
              "px-4 py-2 text-sm text-center transition-colors duration-300",
              statusMessage.type === "success" && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
              statusMessage.type === "error" && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
              statusMessage.type === "info" && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
            )}
          >
            {statusMessage.text}
          </div>
        )}

        {isAddingBookmark && (
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
            <form onSubmit={handleAddBookmark} className="flex flex-col gap-2">
              <div className="flex items-center">
                <Input
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  placeholder="Enter website URL"
                  className="flex-1 text-sm h-9 transition-colors duration-300"
                  autoFocus
                  disabled={isAddingBookmarkLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 text-sm bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90 transition-colors duration-300"
                  disabled={isAddingBookmarkLoading}
                >
                  {isAddingBookmarkLoading ? "Adding..." : "Add Bookmark"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingBookmark(false)}
                  className="h-9 text-sm transition-colors duration-300"
                  disabled={isAddingBookmarkLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors duration-300">
          {sortedBookmarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {searchQuery ? (
                <p className="text-base">No bookmarks match your search query.</p>
              ) : (
                <p className="text-base">No bookmarks yet. Add your first bookmark to get started.</p>
              )}
            </div>
          ) : (
            sortedBookmarks.map((bookmark) => (
              <BookmarkEntry
                key={bookmark.id}
                bookmark={bookmark}
                onRemove={() => removeBookmark(bookmark.id)}
                onContentClick={handleContentClick}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-[425px] transition-colors duration-300">
            <DialogHeader>
              <DialogTitle>Import Bookmarks</DialogTitle>
              <DialogDescription>Upload a JSON file containing your bookmarks.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {importStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    Select a JSON file to import
                  </p>
                  <label className="cursor-pointer bg-[#00FF9D] text-black px-4 py-2 rounded hover:bg-[#00FF9D]/90 transition-colors duration-300">
                    Choose File
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
                </div>
              ) : importStatus === "success" ? (
                <div className="flex items-center justify-center p-6 text-green-600 dark:text-green-400 transition-colors duration-300">
                  <Check className="mr-2 h-5 w-5" />
                  <p>Bookmarks imported successfully!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-red-600 dark:text-red-400 transition-colors duration-300">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <p>Error importing bookmarks. Please try again.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="sm:max-w-[425px] transition-colors duration-300">
            <DialogHeader>
              <DialogTitle>Export Bookmarks</DialogTitle>
              <DialogDescription>Download your bookmarks as a JSON file.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {exportStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    This will download a JSON file containing all your bookmarks.
                  </p>
                  <button
                    onClick={handleExport}
                    className="cursor-pointer bg-[#00FF9D] text-black px-4 py-2 rounded hover:bg-[#00FF9D]/90 transition-colors duration-300"
                  >
                    Export Bookmarks
                  </button>
                </div>
              ) : exportStatus === "success" ? (
                <div className="flex items-center justify-center p-6 text-green-600 dark:text-green-400 transition-colors duration-300">
                  <Check className="mr-2 h-5 w-5" />
                  <p>Bookmarks exported successfully!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-red-600 dark:text-red-400 transition-colors duration-300">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <p>Error importing bookmarks. Please try again.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

interface BookmarkEntryProps {
  bookmark: ReturnType<typeof useBookmarkStore>["bookmarks"][0]
  onRemove: () => void
  onContentClick: (siteId: number, contentId: number) => void
  searchQuery: string
}

function BookmarkEntry({ bookmark, onRemove, onContentClick, searchQuery }: BookmarkEntryProps) {
  // Safely format the date by parsing the ISO string
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Highlight search terms in text
  const highlightSearchTerm = (text: string) => {
    if (!searchQuery.trim()) return text

    const regex = new RegExp(`(${searchQuery.trim()})`, "gi")
    return text.replace(
      regex,
      '<mark class="bg-yellow-100 dark:bg-yellow-900/50 px-0.5 transition-colors duration-300">$1</mark>',
    )
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
            className="text-lg sm:text-xl font-medium tracking-tight hover:text-[#00FF9D] transition-colors duration-300"
            dangerouslySetInnerHTML={{
              __html: searchQuery ? highlightSearchTerm(bookmark.name) : bookmark.name,
            }}
            onClick={(e) => {
              // Stop propagation to prevent the parent div's click handler from firing
              e.stopPropagation()
            }}
          />
          {isNew && <span className="text-xs bg-[#00FF9D] text-black px-1.5 py-0.5 font-medium">New</span>}
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
          dangerouslySetInnerHTML={{
            __html: searchQuery ? highlightSearchTerm(latestContent.title) : latestContent.title,
          }}
          onClick={handleDescriptionClick}
        />
      )}
    </div>
  )
}
