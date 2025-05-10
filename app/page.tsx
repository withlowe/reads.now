import { BookmarkFeed } from "@/components/bookmark-feed"
import { AngularBackground } from "@/components/angular-background"

export default function Home() {
  return (
    <div className="relative">
      <AngularBackground />
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-medium mb-4">Your content, all in one place.</h1>
          <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
            Reader provides the tools to collect, organize, and stay updated with content from your favorite websites.
          </p>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-20">
          <BookmarkFeed />
        </div>
      </div>
    </div>
  )
}
