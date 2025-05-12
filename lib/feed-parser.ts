import { parseStringPromise } from "xml2js"

export interface FeedItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
}

export interface ParsedFeed {
  title: string
  link: string
  description?: string
  items: FeedItem[]
}

/**
 * Attempts to discover RSS/Atom feed URLs from a website
 */
export async function discoverFeeds(url: string): Promise<string[]> {
  try {
    // Normalize URL
    const baseUrl = new URL(url).origin

    // Fetch the HTML of the main page
    const response = await fetch(url)
    const html = await response.text()

    // Look for feed links in the HTML
    const feedUrls: string[] = []

    // Common feed paths to check
    const commonFeedPaths = [
      "/feed",
      "/rss",
      "/feed.xml",
      "/atom.xml",
      "/rss.xml",
      "/index.xml",
      "/feed/atom",
      "/feed/rss",
    ]

    // Extract feed URLs from link tags using a simpler approach
    const linkTags = html.match(/<link[^>]*>/gi) || []
    for (const linkTag of linkTags) {
      if (
        linkTag.includes('rel="alternate"') ||
        linkTag.includes('rel="feed"') ||
        linkTag.includes("rel='alternate'") ||
        linkTag.includes("rel='feed'")
      ) {
        const hrefMatch = linkTag.match(/href=["']([^"']*)["']/)
        if (hrefMatch && hrefMatch[1]) {
          const feedUrl = hrefMatch[1]
          if (
            feedUrl.includes("rss") ||
            feedUrl.includes("atom") ||
            feedUrl.includes("feed") ||
            feedUrl.includes("xml")
          ) {
            try {
              feedUrls.push(new URL(feedUrl, baseUrl).href)
            } catch (e) {
              console.error("Invalid URL:", feedUrl)
            }
          }
        }
      }
    }

    // If no feeds found in link tags, try common feed paths
    if (feedUrls.length === 0) {
      for (const path of commonFeedPaths) {
        try {
          const feedUrl = new URL(path, baseUrl).href
          const feedResponse = await fetch(feedUrl)
          if (
            feedResponse.ok &&
            (feedResponse.headers.get("content-type")?.includes("xml") ||
              feedResponse.headers.get("content-type")?.includes("rss"))
          ) {
            feedUrls.push(feedUrl)
          }
        } catch (error) {
          // Skip failed attempts
        }
      }
    }

    return feedUrls
  } catch (error) {
    console.error("Error discovering feeds:", error)
    return []
  }
}

/**
 * Parses an RSS or Atom feed
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed | null> {
  try {
    const response = await fetch(feedUrl)
    const xml = await response.text()

    // Parse the XML
    const result = await parseStringPromise(xml, { explicitArray: false })

    // Handle RSS feeds
    if (result.rss) {
      const channel = result.rss.channel
      return {
        title: channel.title,
        link: channel.link,
        description: channel.description,
        items: (Array.isArray(channel.item) ? channel.item : [channel.item]).filter(Boolean).map((item: any) => ({
          title: item.title,
          link: item.link,
          description: item.description || item.summary || "",
          pubDate: item.pubDate || item.pubdate || new Date().toISOString(),
          guid: item.guid?._,
        })),
      }
    }

    // Handle Atom feeds
    if (result.feed) {
      const feed = result.feed
      return {
        title: feed.title,
        link: feed.link?.href || feed.link,
        description: feed.subtitle || "",
        items: (Array.isArray(feed.entry) ? feed.entry : [feed.entry]).filter(Boolean).map((entry: any) => ({
          title: entry.title,
          link: entry.link?.href || entry.link,
          description: entry.summary || entry.content || "",
          pubDate: entry.updated || entry.published || new Date().toISOString(),
          guid: entry.id,
        })),
      }
    }

    return null
  } catch (error) {
    console.error("Error parsing feed:", error)
    return null
  }
}
