"use client"

// Update the BookmarkEntry component to better display new content
import { format, parseISO } from "date-fns"
import type { Bookmark } from "@/types"
import { cn } from "@/lib/utils"

interface BookmarkEntryProps {
  bookmark: Bookmark
  onRemove: () => void
  onContentClick: (bookmarkId: string, contentId: string) => void
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

  // Get the latest content
  const latestContent = bookmark.latestContent[0]
  const isNew = latestContent?.isNew

  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-baseline">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-medium tracking-tight hover:text-[#00FF9D] transition-colors"
          >
            {bookmark.name}
          </a>
          {isNew && <span className="ml-2 text-xs bg-[#00FF9D] text-black px-1.5 py-0.5 font-medium">New</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono tabular-nums">{formatDate(bookmark.lastUpdated)}</span>
          <button onClick={onRemove} className="text-xs text-gray-500 hover:text-black font-mono">
            Remove
          </button>
        </div>
      </div>

      {latestContent && (
        <div className={cn(isNew && "border-l-2 border-[#00FF9D] pl-3 -ml-3")}>
          <a
            href={latestContent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 hover:text-black block mb-1"
          >
            {latestContent.title}
          </a>
          <p
            className="text-sm sm:text-base text-gray-600 leading-relaxed"
            onClick={() => onContentClick(bookmark.id, latestContent.id)}
          >
            {latestContent.summary.length > 160
              ? latestContent.summary.substring(0, 160) + "..."
              : latestContent.summary}
          </p>
        </div>
      )}
    </div>
  )
}

export default BookmarkEntry
