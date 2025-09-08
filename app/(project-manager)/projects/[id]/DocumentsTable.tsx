"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Edit,
  Save,
  X,
  Calendar,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: number;
  content: string | null;
  document_type: string | null;
  metadata: any;
  created_at?: string | null;
  updated_at?: string | null;
  project_id?: number | null;
}

interface Project {
  id: number;
  name: string | null;
}

interface DocumentsTableProps {
  documents: Document[];
  projects?: Project[];
  projectId?: number;
  onDocumentsUpdate?: () => void;
}

export function DocumentsTable({ 
  documents: initialDocuments, 
  projects = [], 
  projectId,
  onDocumentsUpdate 
}: DocumentsTableProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [supabase] = useState(() => createClient());

  // Extract title from document
  const extractTitle = (doc: Document): string => {
    if (doc.metadata?.title) return doc.metadata.title;
    if (doc.metadata?.file_path) {
      const parts = doc.metadata.file_path.split('/');
      return parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    }
    if (doc.content) {
      const firstLine = doc.content.split('\n')[0];
      return firstLine.substring(0, 100);
    }
    return `Document ${doc.id}`;
  };

  // Extract date from document
  const extractDate = (doc: Document): string | null => {
    if (doc.metadata?.date) return doc.metadata.date;
    if (doc.metadata?.created_at) return doc.metadata.created_at;
    if (doc.metadata?.updated_at) return doc.metadata.updated_at;
    if (doc.created_at) return doc.created_at;
    return null;
  };

  // Extract summary from document
  const extractSummary = (doc: Document): string => {
    if (doc.metadata?.summary) return doc.metadata.summary;
    if (doc.metadata?.description) return doc.metadata.description;
    if (doc.metadata?.ai_summary) return doc.metadata.ai_summary;
    if (doc.content) {
      return doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '');
    }
    return '';
  };

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setEditedDocument({ ...document });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedDocument({});
  };

  const handleSave = async () => {
    if (!editingId || !editedDocument) return;
    
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const updateData: any = {
        content: editedDocument.content,
        document_type: editedDocument.document_type,
        metadata: editedDocument.metadata,
      };
      
      // Only include project_id if it's not already set by the parent
      if (!projectId && editedDocument.project_id !== undefined) {
        updateData.project_id = editedDocument.project_id;
      }
      
      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', editingId);
      
      if (error) throw error;
      
      // Update local state
      setDocuments(documents => 
        documents.map(doc => 
          doc.id === editingId 
            ? { ...doc, ...editedDocument }
            : doc
        )
      );
      
      setEditingId(null);
      setEditedDocument({});
      toast.success("Document updated successfully");
      
      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleFieldChange = (field: keyof Document, value: any) => {
    if (field === 'metadata') {
      // For metadata updates, merge with existing metadata
      setEditedDocument(prev => ({ 
        ...prev, 
        metadata: { 
          ...(prev.metadata || {}), 
          ...value 
        } 
      }));
    } else {
      setEditedDocument(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDelete = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete.id);
      
      if (error) throw error;
      
      // Update local state
      setDocuments(documents => 
        documents.filter(doc => doc.id !== documentToDelete.id)
      );
      
      toast.success("Document deleted successfully");
      
      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      if (document.content) {
        const blob = new Blob([document.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${extractTitle(document)}.txt`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("No content available to download");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-200 hover:bg-transparent">
              <TableHead className="w-[25%] font-semibold text-gray-900 px-6 py-4">Title</TableHead>
              <TableHead className="w-[12%] font-semibold text-gray-900 px-4 py-4">Date</TableHead>
              {!projectId && (
                <TableHead className="w-[18%] font-semibold text-gray-900 px-4 py-4">Project</TableHead>
              )}
              <TableHead className={`${projectId ? "w-[45%]" : "w-[30%]"} font-semibold text-gray-900 px-4 py-4`}>Summary</TableHead>
              <TableHead className="w-[15%] text-center font-semibold text-gray-900 px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={projectId ? 4 : 5} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-gray-300" />
                    <span className="text-sm font-medium">No documents found</span>
                    <span className="text-xs text-gray-400">Documents will appear here when added</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const isEditing = editingId === document.id;
                const currentDocument = isEditing ? editedDocument : document;
                const documentDate = extractDate(currentDocument as Document);
                
                return (
                  <TableRow key={document.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      {isEditing ? (
                        <Input
                          value={currentDocument.metadata?.title || extractTitle(currentDocument as Document)}
                          onChange={(e) => handleFieldChange("metadata", { title: e.target.value })}
                          className="w-full"
                          placeholder="Enter title..."
                        />
                      ) : (
                        <div className="font-semibold text-gray-900 text-sm">
                          {extractTitle(document)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="px-4 py-4">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={currentDocument.metadata?.date ? 
                            new Date(currentDocument.metadata.date).toISOString().split('T')[0] : 
                            ''
                          }
                          onChange={(e) => handleFieldChange("metadata", { date: e.target.value })}
                          className="w-full text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">
                            {documentDate 
                              ? format(new Date(documentDate), "MMM d, yyyy")
                              : "No date"
                            }
                          </span>
                        </div>
                      )}
                    </TableCell>
                    
                    {!projectId && (
                      <TableCell className="px-4 py-4">
                        {isEditing ? (
                          <Select
                            value={currentDocument.project_id ? String(currentDocument.project_id) : "none"}
                            onValueChange={(value) => handleFieldChange("project_id", value === "none" ? null : Number(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No project</SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={String(project.id)}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm">
                            {document.project_id 
                              ? <span className="font-medium text-gray-900">
                                  {projects.find(p => p.id === document.project_id)?.name || "Unknown"}
                                </span>
                              : <span className="text-gray-400 italic text-xs">No project</span>
                            }
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    <TableCell className="px-4 py-4">
                      {isEditing ? (
                        <Textarea
                          value={currentDocument.metadata?.summary || extractSummary(currentDocument as Document)}
                          onChange={(e) => handleFieldChange("metadata", { summary: e.target.value })}
                          className="w-full min-h-[60px] text-xs"
                          placeholder="Enter summary..."
                        />
                      ) : (
                        <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {extractSummary(document) || <span className="text-gray-400 italic">No summary</span>}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Save changes"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(document)}
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit document"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(document)}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Download document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(document)}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Delete document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{extractTitle(documentToDelete || {} as Document)}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}