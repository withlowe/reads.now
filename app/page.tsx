import { BookmarkFeed } from "@/components/bookmark-feed"
import { VercelBackground } from "@/components/vercel-background"

export default function Home() {
  return (
    <div className="relative">
      <VercelBackground />
      <div className="relative z-10">
        <div className="w-full px-3 sm:px-4 py-12 sm:py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">Your content, all in one place.</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Reader provides the tools to collect, organize, and stay updated with content from your favorite websites.
          </p>
        </div>
        <div className="w-full px-2 sm:px-4 pb-12 sm:pb-16">
          <BookmarkFeed />
        </div>
      </div>
    </div>
  )
}
