"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { PageHeader } from "@/components/page-header";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  Search,
  Edit,
  Save,
  X,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  summary: string | null;
  project_id: number | null;
  processing_status: string | null;
  participants: string[] | null;
  action_items: string[] | null;
  created_at: string;
  updated_at: string;
  file_type?: string | null;
  file_size?: number | null;
  author?: string | null;
  content?: string | null;
  document_type?: string | null;
  embedding?: string | null;
  metadata?: any;
}

interface Project {
  id: number;
  name: string | null;
}

export default function MeetingsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>({});
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<string>("");
  const [supabase] = useState(() => {
    const client = createClient();
    if (!client) {
      console.error("Failed to create Supabase client. Check environment variables.");
    }
    return client;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error("Database connection not available. Please check your configuration.");
      }
      
      // Check authentication status (optional in development)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn("Authentication warning:", authError);
        // In development, continue without authentication
        // In production, you might want to throw an error or redirect to login
        console.log("Continuing without authentication (development mode)");
      } else {
        console.log("Authenticated user:", user?.email);
      }
      
      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (docsError) {
        console.error("Error loading documents:", {
          message: docsError.message,
          details: docsError.details,
          hint: docsError.hint,
          code: docsError.code
        });
        throw new Error(docsError.message || "Failed to load documents");
      }
      
      console.log("Documents loaded:", docsData?.length || 0);
      
      // Load projects for the dropdown
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (projectsError) {
        console.error("Error loading projects:", {
          message: projectsError.message,
          details: projectsError.details,
          hint: projectsError.hint,
          code: projectsError.code
        });
        throw new Error(projectsError.message || "Failed to load projects");
      }
      
      console.log("Projects loaded:", projectsData?.length || 0);
      
      setDocuments((docsData || []).map(doc => ({
        id: String(doc.id || ''),
        title: doc.title || '',
        summary: doc.summary,
        project_id: doc.project_id,
        processing_status: doc.processing_status,
        participants: doc.participants,
        action_items: doc.action_items,
        created_at: doc.created_at || new Date().toISOString(),
        updated_at: doc.updated_at || new Date().toISOString(),
        file_type: doc.file_type,
        file_size: doc.file_size,
        author: doc.author,
        content: doc.content,
        document_type: doc.document_type,
        embedding: doc.embedding,
        metadata: doc.metadata
      })));
      setProjects((projectsData || []).map(proj => ({
        id: proj.id,
        name: proj.name || 'Unnamed Project'
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in loadData:", {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(errorMessage || "Failed to load data. Please try refreshing the page.");
      toast.error("Failed to load data", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
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
      
      const { error } = await supabase
        .from('documents')
        .update({
          title: editedDocument.title,
          summary: editedDocument.summary,
          project_id: editedDocument.project_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', Number(editingId));
      
      if (error) throw error;
      
      // Update local state
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === editingId 
            ? { ...doc, ...editedDocument, updated_at: new Date().toISOString() }
            : doc
        )
      );
      
      setEditingId(null);
      setEditedDocument({});
      toast.success("Document updated successfully");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleFieldChange = (field: keyof Document, value: any) => {
    setEditedDocument(prev => ({ ...prev, [field]: value }));
  };

  const openSummaryDialog = (summary: string) => {
    setSelectedSummary(summary);
    setSummaryDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { color: "bg-yellow-500/10 text-yellow-600", icon: AlertCircle },
      processing: { color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
      completed: { color: "bg-green-500/10 text-green-600", icon: CheckCircle },
      failed: { color: "bg-red-500/10 text-red-600", icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={cn("gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter(doc =>
    searchTerm === "" ||
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.participants?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <PageHeader 
          title="Meetings & Documents" 
          description="View and manage all meeting transcripts and documents" 
        />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Title</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[300px]">Summary</TableHead>
              <TableHead className="min-w-[150px]">Project</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((document) => {
                const isEditing = editingId === document.id;
                const currentDoc = isEditing ? editedDocument : document;
                
                return (
                  <TableRow key={document.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={currentDoc.title || ""}
                          onChange={(e) => handleFieldChange("title", e.target.value)}
                          className="min-w-[200px]"
                        />
                      ) : (
                        <div className="font-medium">{document.title}</div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {document.created_at 
                          ? format(new Date(document.created_at), "MMM d, yyyy")
                          : "No date"
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={currentDoc.summary || ""}
                          onChange={(e) => handleFieldChange("summary", e.target.value)}
                          className="min-w-[250px] min-h-[80px]"
                          placeholder="Enter summary..."
                        />
                      ) : (
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground line-clamp-2"
                          onClick={() => document.summary && openSummaryDialog(document.summary)}
                        >
                          {document.summary || "No summary"}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={currentDoc.project_id ? String(currentDoc.project_id) : "none"}
                          onValueChange={(value) => handleFieldChange("project_id", value === "none" ? null : Number(value))}
                        >
                          <SelectTrigger className="min-w-[150px]">
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
                        <div>
                          {document.project_id 
                            ? projects.find(p => p.id === document.project_id)?.name || "Unknown"
                            : <span className="text-muted-foreground">No project</span>
                          }
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(document.processing_status)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(document)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Summary</DialogTitle>
            <DialogDescription>
              Full summary of the document
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap text-sm">
            {selectedSummary}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}