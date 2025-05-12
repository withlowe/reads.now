"use client"

import { SimpleBookmarkFeed } from "@/components/simple-bookmark-feed"

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col">
        <header className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="w-full px-3 sm:px-4 h-14 flex items-center justify-between">
            <div className="font-medium flex items-center">
              <span className="text-lg tracking-tight font-bold">Reads.now</span>
            </div>
          </div>
        </header>

        <div className="w-full px-3 sm:px-4 py-12 sm:py-16 text-center">
          <h1 className="mb-4">Your bookmarks, Always updated.</h1>
          <p className="subtitle max-w-3xl mx-auto mb-4">Collect, organize, and stay updated with your bookmarks.</p>
        </div>

        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 pb-12 sm:pb-16 flex-1">
          <SimpleBookmarkFeed />
        </div>

        <footer className="w-full py-6 text-center text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">
          Built by Supervisual
        </footer>
      </div>
    </div>
  )
}
