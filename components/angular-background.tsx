export function AngularBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-r from-orange-50 via-red-50 to-teal-50 opacity-80"></div>

      {/* Angular geometric shapes */}
      <div className="absolute top-[100px] left-[10%] w-[300px] h-[300px] bg-orange-200/20 rotate-45 transform-gpu"></div>
      <div className="absolute top-[150px] right-[15%] w-[250px] h-[250px] bg-teal-200/20 rotate-12 transform-gpu"></div>
      <div className="absolute top-[50px] left-[30%] w-[200px] h-[200px] bg-red-200/10 -rotate-12 transform-gpu"></div>

      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-cols-12 gap-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-l border-gray-100 h-full"></div>
        ))}
      </div>

      {/* Horizontal lines */}
      <div className="absolute inset-0 grid grid-rows-12 gap-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-t border-gray-100 w-full"></div>
        ))}
      </div>

      {/* Angular line accents */}
      <div className="absolute top-[200px] left-[20%] w-[400px] h-[1px] bg-orange-200 rotate-45 transform-gpu"></div>
      <div className="absolute top-[300px] right-[25%] w-[300px] h-[1px] bg-teal-200 -rotate-30 transform-gpu"></div>
    </div>
  )
}
