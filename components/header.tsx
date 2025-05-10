"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Download, Upload, Check, AlertCircle } from "lucide-react"
import { useBookmarkStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export function Header() {
  const { bookmarks, importBookmarks } = useBookmarkStore()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle")

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

  return (
    <header className="border-b border-gray-100">
      <div className="w-full px-3 sm:px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-medium flex items-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 text-[#00FF9D]"
          >
            <path d="M12 2L2 19.5H22L12 2Z" fill="currentColor" />
          </svg>
          <span className="text-lg tracking-tight">Reads.now</span>
        </Link>
        <div className="flex items-center gap-3">
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
        </div>
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
    </header>
  )
}
