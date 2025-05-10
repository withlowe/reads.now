"use client"

import { useState } from "react"
import { BookmarkFeed } from "@/components/bookmark-feed"
import { VercelBackground } from "@/components/vercel-background"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowDown } from "lucide-react"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [compactMode, setCompactMode] = useState(false)

  return (
    <div className="relative min-h-screen flex flex-col">
      <VercelBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <Header />

        {!compactMode && (
          <div className="w-full px-3 sm:px-4 py-12 sm:py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">Your bookmarks, Always updated.</h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              Collect, organize, and stay updated with your bookmarks.
            </p>
            <button
              onClick={() => setCompactMode(true)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors gap-1"
            >
              <span>Switch to compact view</span>
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className={`w-full max-w-3xl mx-auto px-2 sm:px-4 ${compactMode ? "pt-4" : "pb-12 sm:pb-16"} flex-1`}>
          <BookmarkFeed
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            compactMode={compactMode}
            setCompactMode={setCompactMode}
          />
        </div>
        <Footer />
      </div>
    </div>
  )
}
