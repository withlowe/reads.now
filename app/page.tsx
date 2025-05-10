import { BookmarkFeed } from "@/components/bookmark-feed"

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl mb-8">Reads.now</h1>
      <BookmarkFeed />
    </div>
  )
}
