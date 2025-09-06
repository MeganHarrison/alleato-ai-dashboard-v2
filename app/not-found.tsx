import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-6">Could not find the requested page.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        Return Home
      </Link>
    </div>
  )
}