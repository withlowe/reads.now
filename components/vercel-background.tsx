export function VercelBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 opacity-80 transition-colors duration-300"></div>

      {/* Angular geometric shapes with mint green */}
      <div className="absolute top-[100px] left-[10%] w-[300px] h-[300px] bg-[#00FF9D]/10 dark:bg-[#00FF9D]/5 rotate-45 transform-gpu transition-colors duration-300"></div>
      <div className="absolute top-[150px] right-[15%] w-[250px] h-[250px] bg-[#00FF9D]/5 dark:bg-[#00FF9D]/3 rotate-12 transform-gpu transition-colors duration-300"></div>
      <div className="absolute top-[50px] left-[30%] w-[200px] h-[200px] bg-[#00FF9D]/10 dark:bg-[#00FF9D]/5 -rotate-12 transform-gpu transition-colors duration-300"></div>

      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-cols-12 gap-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="border-l border-gray-100 dark:border-gray-800 h-full transition-colors duration-300"
          ></div>
        ))}
      </div>

      {/* Horizontal lines */}
      <div className="absolute inset-0 grid grid-rows-12 gap-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="border-t border-gray-100 dark:border-gray-800 w-full transition-colors duration-300"
          ></div>
        ))}
      </div>

      {/* Angular line accents */}
      <div className="absolute top-[200px] left-[20%] w-[400px] h-[1px] bg-[#00FF9D]/30 dark:bg-[#00FF9D]/20 rotate-45 transform-gpu transition-colors duration-300"></div>
      <div className="absolute top-[300px] right-[25%] w-[300px] h-[1px] bg-[#00FF9D]/20 dark:bg-[#00FF9D]/10 -rotate-30 transform-gpu transition-colors duration-300"></div>
    </div>
  )
}
