export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-heading">SF WINNER</h1>
          <p className="text-gray-400 mt-2">Team Manager Portal</p>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>
        <p className="text-center text-gray-500 text-sm mt-6">
          &copy; 2026 SF Winner Sports Club
        </p>
      </div>
    </div>
  )
}