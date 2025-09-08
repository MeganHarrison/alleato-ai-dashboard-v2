import { EditableDocumentsTable } from "@/components/tables/editable-documents-table";
import { getDocuments } from "@/app/actions/documents-full-actions";
import { AddDocumentButton } from "@/components/table-buttons/add-document-button";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { documents, error } = await getDocuments();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <PageHeader 
            title="Documents" 
            description="Manage and view all documents in the system" 
          />
        </div>
        <AddDocumentButton />
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          <h3 className="font-medium">Error loading documents</h3>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-sm mt-2">
            Make sure the documents table exists in your Supabase database.
          </p>
        </div>
      ) : (
        <EditableDocumentsTable documents={documents} />
      )}
    </main>
  );
}
