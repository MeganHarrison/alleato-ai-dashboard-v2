export default function FMGlobalDocsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">FM Global Documentation</h1>
      <p className="text-muted-foreground mb-6">
        Automatic Storage and Retrieval Systems (ASRS) Guidelines
      </p>
      
      <div className="border rounded-lg p-4 bg-muted/50">
        <h2 className="text-lg font-medium mb-2">Access Documentation</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The FM Global Data Sheet 8-34 documentation is available below:
        </p>
        <a 
          href="/fm-global-docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Open Documentation
        </a>
      </div>
      
      <iframe
        src="/fm-global-docs/"
        className="w-full h-[600px] border rounded-lg mt-6"
        title="FM Global Documentation"
      />
    </div>
  );
}