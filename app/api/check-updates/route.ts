import { NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import crypto from "crypto"

// Helper function to extract content from HTML
function extractContent(html: string) {
  try {
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Try to find the main content
    const mainContent = document.querySelector("main, article, .content, #content")
    const title = document.querySelector("title")?.textContent || ""

    // Extract text content
    const content = mainContent ? mainContent.textContent : document.body.textContent

    // Return a hash of the content and the title
    return {
      contentHash: crypto
        .createHash("md5")
        .update(content || "")
        .digest("hex"),
      title: title,
      summary: content ? content.substring(0, 200) + "..." : "No content found",
    }
  } catch (error) {
    console.error("Error extracting content:", error)
    return { contentHash: "", title: "", summary: "" }
  }
}

export async function POST(request: Request) {
  try {
    const { url, lastContentHash } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkUpdater/1.0; +https://yourdomain.com)",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch content: ${response.status} ${response.statusText}`,
        },
        { status: 500 },
      )
    }

    const html = await response.text()

    // Extract and hash the content
    const { contentHash, title, summary } = extractContent(html)

    // Check if content has changed
    const hasChanged = !lastContentHash || contentHash !== lastContentHash

    return NextResponse.json({
      url,
      hasChanged,
      contentHash,
      title: title || new URL(url).hostname,
      summary,
      lastChecked: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking for updates:", error)
    return NextResponse.json(
      {
        error: "Failed to check for updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
