"use client"

import type React from "react"

import { useState, useRef } from "react"
import { format, parseISO } from "date-fns"
import { PlusIcon, RefreshCw, Download, Upload, Check, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBookmarkStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SearchBar } from "@/components/search-bar"

interface BookmarkFeedProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function BookmarkFeed({ searchQuery, setSearchQuery }: BookmarkFeedProps) {
  const { bookmarks, addBookmark, removeBookmark, updateBookmarks, markAsRead, importBookmarks } = useBookmarkStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUpdating, setIsUpdating] = useState(false)
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("")
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [isAddingBookmarkLoading, setIsAddingBookmarkLoading] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")

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

  // Update bookmarks with new content
  const handleUpdateBookmarks = async () => {
    setIsUpdating(true)
    try {
      await updateBookmarks()
      toast({
        title: "Update complete",
        description: "Your bookmarks have been checked for new content.",
      })
    } catch (error) {
      console.error("Error updating bookmarks:", error)
      toast({
        title: "Update failed",
        description: "There was an error checking for new content.",
        variant: "destructive",
      })
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
      toast({
        title: "Bookmark added",
        description: "The website has been added to your bookmarks.",
      })
      setNewBookmarkUrl("")
      setIsAddingBookmark(false)
    } catch (error) {
      console.error("Error adding bookmark:", error)
      toast({
        title: "Failed to add bookmark",
        description: "There was an error adding the bookmark. Please try again.",
        variant: "destructive",
      })
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

      <div className="bg-white border border-gray-100 shadow-lg w-full">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight">
              {searchQuery ? `Search: "${searchQuery}"` : "Bookmarks"}
            </h2>
            <button
              className="p-1.5 text-gray-500 hover:text-[#00FF9D] transition-colors"
              title="Import bookmarks"
              onClick={() => setImportDialogOpen(true)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Import</span>
            </button>
            <button
              className="p-1.5 text-gray-500 hover:text-[#00FF9D] transition-colors"
              title="Export bookmarks"
              onClick={() => setExportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </button>
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateBookmarks}
              disabled={isUpdating}
              className="h-9 text-sm gap-1.5 flex-1 sm:flex-initial"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
              {isUpdating ? "Checking sites..." : "Check for updates"}
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
                  disabled={isAddingBookmarkLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 text-sm bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
                  disabled={isAddingBookmarkLoading}
                >
                  {isAddingBookmarkLoading ? "Adding..." : "Add Bookmark"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingBookmark(false)}
                  className="h-9 text-sm"
                  disabled={isAddingBookmarkLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {sortedBookmarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Import Bookmarks</DialogTitle>
              <DialogDescription>Upload a JSON file containing your bookmarks.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {importStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <p className="mb-4 text-sm text-gray-500">Select a JSON file to import</p>
                  <label className="cursor-pointer bg-[#00FF9D] text-black px-4 py-2 rounded hover:bg-[#00FF9D]/90 transition-colors">
                    Choose File
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
                </div>
              ) : importStatus === "success" ? (
                <div className="flex items-center justify-center p-6 text-green-600">
                  <Check className="mr-2 h-5 w-5" />
                  <p>Bookmarks imported successfully!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-red-600">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <p>Error importing bookmarks. Please try again.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Export Bookmarks</DialogTitle>
              <DialogDescription>Download your bookmarks as a JSON file.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {exportStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <p className="mb-4 text-sm text-gray-500">
                    This will download a JSON file containing all your bookmarks.
                  </p>
                  <button
                    onClick={handleExport}
                    className="cursor-pointer bg-[#00FF9D] text-black px-4 py-2 rounded hover:bg-[#00FF9D]/90 transition-colors"
                  >
                    Export Bookmarks
                  </button>
                </div>
              ) : exportStatus === "success" ? (
                <div className="flex items-center justify-center p-6 text-green-600">
                  <Check className="mr-2 h-5 w-5" />
                  <p>Bookmarks exported successfully!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-red-600">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <p>Error exporting bookmarks. Please try again.</p>
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
    return text.replace(regex, '<mark class="bg-yellow-100 px-0.5">$1</mark>')
  }

  // Get the latest content
  const latestContent = bookmark.latestContent[0]
  const isNew = latestContent?.isNew

  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline flex-wrap gap-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-medium tracking-tight hover:text-[#00FF9D] transition-colors"
            dangerouslySetInnerHTML={{
              __html: searchQuery ? highlightSearchTerm(bookmark.name) : bookmark.name,
            }}
          />
          {isNew && <span className="text-xs bg-[#00FF9D] text-black px-1.5 py-0.5 font-medium">New</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-500 font-mono">{formatDate(bookmark.lastUpdated)}</span>
          <button onClick={onRemove} className="text-xs text-gray-500 hover:text-black font-mono">
            Remove
          </button>
        </div>
      </div>

      {latestContent && (
        <div className="space-y-2">
          <a
            href={latestContent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 hover:text-black flex items-center gap-1"
            dangerouslySetInnerHTML={{
              __html: searchQuery ? highlightSearchTerm(latestContent.title) : latestContent.title,
            }}
          />

          <div
            className="text-sm sm:text-base text-gray-600 leading-relaxed cursor-pointer"
            onClick={() => onContentClick(bookmark.id, latestContent.id)}
          >
            <p
              dangerouslySetInnerHTML={{
                __html: searchQuery
                  ? highlightSearchTerm(
                      latestContent.summary.length > 160
                        ? latestContent.summary.substring(0, 160) + "..."
                        : latestContent.summary,
                    )
                  : latestContent.summary.length > 160
                    ? latestContent.summary.substring(0, 160) + "..."
                    : latestContent.summary,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
