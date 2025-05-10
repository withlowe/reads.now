import { Home, Search, Bookmark, Bell, Plus } from "lucide-react"

export function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-8 border-r border-gray-100">
      <div className="flex flex-col items-center space-y-8">
        <a href="#" className="p-2 rounded-full hover:bg-gray-100">
          <Home className="h-5 w-5 text-gray-400" />
        </a>
        <a href="#" className="p-2 rounded-full hover:bg-gray-100">
          <Search className="h-5 w-5 text-gray-400" />
        </a>
        <a href="#" className="p-2 rounded-full hover:bg-gray-100">
          <Bookmark className="h-5 w-5 text-gray-400" />
        </a>
        <a href="#" className="p-2 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-400" />
        </a>
      </div>

      <div className="mt-auto">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
          <Plus className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
