export function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-r from-orange-50 via-red-50 to-teal-50 opacity-80"></div>
      <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-200/20 via-red-300/20 to-teal-200/20 rounded-full blur-3xl"></div>
      <div className="absolute top-[100px] left-[20%] w-[300px] h-[300px] bg-orange-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-[150px] right-[20%] w-[400px] h-[400px] bg-teal-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      <div className="grid grid-cols-12 h-full w-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-l border-gray-100 h-full"></div>
        ))}
      </div>
    </div>
  )
}
