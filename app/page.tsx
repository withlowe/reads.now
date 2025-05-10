"use client"

import { useState } from "react"
import { BookmarkFeed } from "@/components/bookmark-feed"
import { VercelBackground } from "@/components/vercel-background"
import { Header } from "@/components/header"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="relative">
      <VercelBackground />
      <div className="relative z-10">
        <Header />
        <div className="w-full px-3 sm:px-4 py-12 sm:py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">Your bookmarks, Always updated.</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Collect, organize, and stay updated with your bookmarks.
          </p>
        </div>
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 pb-12 sm:pb-16">
          <BookmarkFeed searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>
    </div>
  )
}
