"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
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
          <span className="text-lg tracking-tight font-bold">Reads.now</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
