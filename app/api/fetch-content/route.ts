import { NextResponse } from "next/server"
import { discoverFeeds, parseFeed } from "@/lib/feed-parser"
import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // First try to find and parse RSS/Atom feeds
    const feedUrls = await discoverFeeds(url)

    if (feedUrls.length > 0) {
      // Use the first feed found
      const feedData = await parseFeed(feedUrls[0])

      if (feedData && feedData.items.length > 0) {
        return NextResponse.json({
          source: "feed",
          feedUrl: feedUrls[0],
          title: feedData.title,
          link: feedData.link,
          items: feedData.items.slice(0, 10), // Limit to 10 items
        })
      }
    }

    // Fallback to basic HTML scraping if no feeds found or parsing failed
    const response = await fetch(url)
    const html = await response.text()

    // Use JSDOM and Readability to extract content
    const dom = new JSDOM(html, { url })
    const document = dom.window.document

    // Get site title
    const siteTitle = document.querySelector("title")?.textContent || new URL(url).hostname

    // Extract recent articles using common patterns
    const articles = []

    // Look for article elements, recent posts, etc.
    const articleSelectors = [
      "article",
      ".post",
      ".entry",
      ".article",
      ".blog-post",
      ".news-item",
      ".story",
      '[class*="article"]',
      '[class*="post"]',
      '[class*="entry"]',
    ]

    for (const selector of articleSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        for (const element of elements) {
          // Try to extract title, link, and summary
          const titleEl = element.querySelector("h1, h2, h3, .title, .headline")
          const linkEl = element.querySelector("a")
          const summaryEl = element.querySelector("p, .summary, .excerpt, .description")

          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim()
            const link = new URL(linkEl.getAttribute("href") || "", url).href
            const summary = summaryEl?.textContent?.trim() || ""

            if (title && link) {
              articles.push({
                title,
                link,
                description: summary,
                pubDate: new Date().toISOString(), // No reliable way to get date from generic scraping
              })
            }
          }
        }

        if (articles.length > 0) break
      }
    }

    // If we found articles through scraping
    if (articles.length > 0) {
      return NextResponse.json({
        source: "scrape",
        title: siteTitle,
        link: url,
        items: articles.slice(0, 5), // Limit to 5 items for scraped content
      })
    }

    // If all else fails, use Readability to extract the main content
    const reader = new Readability(document)
    const article = reader.parse()

    if (article) {
      return NextResponse.json({
        source: "readability",
        title: siteTitle,
        link: url,
        items: [
          {
            title: article.title,
            link: url,
            description: article.excerpt || article.textContent.slice(0, 200) + "...",
            pubDate: new Date().toISOString(),
          },
        ],
      })
    }

    return NextResponse.json({ error: "Could not extract content from the URL" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
