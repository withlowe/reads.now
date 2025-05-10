import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-medium flex items-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path d="M12 2L2 19.5H22L12 2Z" fill="currentColor" />
          </svg>
          <span>Reader</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">
            Login
          </Link>
        </div>
      </div>
    </header>
  )
}
