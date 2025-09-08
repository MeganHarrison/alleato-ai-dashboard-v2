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
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  meeting_date: string | null;
  summary: string | null;
  project_id: number | null;
  processing_status: string | null;
  participants: string[] | null;
  action_items: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
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
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('meeting_date', { ascending: false, nullsFirst: false });
      
      if (docsError) throw docsError;
      
      // Load projects for the dropdown
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (projectsError) throw projectsError;
      
      setDocuments(docsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try refreshing the page.");
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
      const { error } = await supabase
        .from('documents')
        .update({
          title: editedDocument.title,
          meeting_date: editedDocument.meeting_date,
          summary: editedDocument.summary,
          project_id: editedDocument.project_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
      
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
                      {isEditing ? (
                        <Input
                          type="date"
                          value={currentDoc.meeting_date || ""}
                          onChange={(e) => handleFieldChange("meeting_date", e.target.value)}
                          className="min-w-[120px]"
                        />
                      ) : (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {document.meeting_date 
                            ? format(new Date(document.meeting_date), "MMM d, yyyy")
                            : "No date"
                          }
                        </div>
                      )}
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
                          value={String(currentDoc.project_id || "")}
                          onValueChange={(value) => handleFieldChange("project_id", value ? Number(value) : null)}
                        >
                          <SelectTrigger className="min-w-[150px]">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No project</SelectItem>
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