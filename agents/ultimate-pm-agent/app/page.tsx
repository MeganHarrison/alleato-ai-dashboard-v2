import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Ultimate PM Agent</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Link 
            href="/chat"
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Leadership Chat</h2>
            <p className="text-muted-foreground">
              Chat with AI to access project knowledge, meeting insights, and documents
            </p>
          </Link>
          
          <Link 
            href="/dashboard"
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Project Dashboard</h2>
            <p className="text-muted-foreground">
              View projects, meeting insights, and manage documents
            </p>
          </Link>
          
          <Link 
            href="/vectorize"
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Document Processing</h2>
            <p className="text-muted-foreground">
              Upload and vectorize documents for RAG search
            </p>
          </Link>
          
          <Link 
            href="/insights"
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">Meeting Insights</h2>
            <p className="text-muted-foreground">
              Generate and view insights from meeting transcripts
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
